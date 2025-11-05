// routes/messageRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';

const router = express.Router();

// GET /api/projects/:projectId/messages?limit=50&page=1&includeDeleted=false
router.get('/projects/:projectId/messages', protect, async (req, res) => {
  const { projectId } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const page = parseInt(req.query.page, 10) || 1;
  const includeDeleted = req.query.includeDeleted === 'true';

  try {
    const filter = { project: projectId };
    if (!includeDeleted) filter.deleted = false;

    const total = await Message.countDocuments(filter);
    const messages = await Message.find(filter)
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name email')
      .lean();

    res.json({ messages, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('fetch messages error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/:messageId
router.delete('/messages/:messageId', protect, async (req, res) => {
  const { messageId } = req.params;
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

    // emit to project room that message deleted
    const projectId = msg.project.toString();
    // use io to emit — but routes file doesn't have io; we will emit via a simple approach:
    // Option A: require io from server (not recommended). Option B: frontend poll / websocket sends delete.
    // For simplicity, return success here. Frontend socket can also emit a 'messageDeleted' via socket.
    return res.json({ message: 'Message deleted' });
  } catch (err) {
    console.error('delete message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
