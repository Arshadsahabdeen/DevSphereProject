// backend/controllers/messagesController.js
import Message from '../models/Message.js';

/**
 * Helper to fetch messages for a projectId with pagination and includeDeleted option.
 * Returns an object: { messages: [], meta: { total, page, limit, pages } }
 */
export async function fetchMessagesForProject(projectId, { limit = 50, page = 1, includeDeleted = false } = {}) {
  const filter = { project: projectId };
  if (!includeDeleted) filter.deleted = false;

  const total = await Message.countDocuments(filter);
  const messages = await Message.find(filter)
    .sort({ createdAt: 1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('sender', 'name email')
    .lean();

  return { messages: messages || [], meta: { total, page, limit, pages: Math.ceil(total / limit) } };
}

/**
 * GET /api/projects/:projectId/messages
 * Returns { messages, meta }
 */
export async function getByProject(req, res) {
  const { projectId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const page = parseInt(req.query.page, 10) || 1;
  const includeDeleted = req.query.includeDeleted === 'true';

  if (!projectId) {
    return res.status(400).json({ message: 'Missing projectId' });
  }

  try {
    const result = await fetchMessagesForProject(projectId, { limit, page, includeDeleted });
    return res.json(result);
  } catch (err) {
    console.error('messagesController.getByProject error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * Compatibility alias:
 * GET /api/messages/:projectId
 * Returns the same payload shape as getByProject
 */
export async function getByProjectAlias(req, res) {
  // Reuse getByProject logic
  return getByProject(req, res);
}

/**
 * DELETE /api/messages/:messageId
 * Soft-deletes a message (only sender allowed)
 */
export async function deleteMessage(req, res) {
  const { messageId } = req.params;
  if (!messageId) {
    return res.status(400).json({ message: 'Missing messageId' });
  }

  try {
    const msg = await Message.findById(messageId);
    if (!msg) return res.status(404).json({ message: 'Message not found' });

    // allow if sender
    if (msg.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete' });
    }

    msg.deleted = true;
    msg.content = '';
    await msg.save();

    // Note: socket emission handled in socket logic (if desired)
    return res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('messagesController.deleteMessage error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
