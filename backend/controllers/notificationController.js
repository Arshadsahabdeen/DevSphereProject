// backend/controllers/notificationController.js
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Project from '../models/Project.js';

/**
 * Optional Socket.IO instance (set with setNotificationIO)
 * If set, controllers will emit 'notification' events to recipient rooms (room name = user-${id}).
 */
let io = null;
export function setNotificationIO(ioInstance) {
  io = ioInstance;
}

/**
 * Helper to emit notification to recipient over socket (if io available).
 * Emits to room equal to recipient's id: 'user-<recipientId>'
 */
function emitNotification(notif) {
  if (!io || !notif || !notif.recipient) return;
  try {
    const room = `user-${String(notif.recipient)}`; // match server's join room
    io.to(room).emit('notification', {
      id: notif._id,
      recipient: notif.recipient,
      sender: notif.sender || null,
      project: notif.project || null,
      type: notif.type,
      title: notif.title,
      body: notif.body,
      read: notif.read,
      meta: notif.meta || {},
      createdAt: notif.createdAt
    });
  } catch (e) {
    console.warn('emitNotification error', e);
  }
}

/**
 * Emit a notification update (e.g., marked read) to the user's room
 */
function emitNotificationUpdate(recipientId, payload) {
  if (!io || !recipientId) return;
  try {
    const room = `user-${String(recipientId)}`;
    io.to(room).emit('notificationUpdated', payload);
  } catch (e) {
    console.warn('emitNotificationUpdate error', e);
  }
}

/**
 * Emit that all notifications were marked read for the user
 */
function emitNotificationsMarkedAllRead(recipientId) {
  if (!io || !recipientId) return;
  try {
    const room = `user-${String(recipientId)}`;
    io.to(room).emit('notificationsMarkedRead', { userId: recipientId });
  } catch (e) {
    console.warn('emitNotificationsMarkedAllRead error', e);
  }
}

/**
 * POST /api/notifications
 * Creates a notification.
 * Body: { recipient, type, title, body?, meta?, sender?, project? }
 */
export async function createNotification(req, res) {
  try {
    const {
      recipient,
      type,
      title,
      body = '',
      meta = {},
      sender = null,
      project = null
    } = req.body;

    if (!recipient || !type || !title) {
      return res.status(400).json({ message: 'recipient, type and title are required' });
    }

    // optional: verify recipient exists
    const userExists = await User.findById(recipient).select('_id').lean();
    if (!userExists) return res.status(404).json({ message: 'Recipient not found' });

    // optional: verify project if provided
    if (project) {
      const projectExists = await Project.findById(project).select('_id').lean();
      if (!projectExists) return res.status(404).json({ message: 'Project context not found' });
    }

    const n = new Notification({
      recipient,
      sender,
      project,
      type,
      title,
      body,
      meta
    });

    await n.save();
    // populate sender for response
    try {
      await n.populate('sender', 'name email');
    } catch (e) {
      // populate might already work depending on mongoose version; ignore if fails
    }

    // Emit via socket if available
    emitNotification(n);

    return res.status(201).json({ notification: n });
  } catch (err) {
    console.error('createNotification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/notifications
 * Lists authenticated user's notifications (paginated)
 * Query params: page, limit
 */
export async function listNotifications(req, res) {
  const limit = parseInt(req.query.limit, 10) || 50;
  const page = parseInt(req.query.page, 10) || 1;

  try {
    const filter = { recipient: req.user._id };
    const total = await Notification.countDocuments(filter);
    const items = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'name email')
      .lean();

    return res.json({
      notifications: items,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error('listNotifications error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/notifications/:id
 * Get single notification (must belong to user)
 */
export async function getNotification(req, res) {
  const { id } = req.params;
  try {
    const n = await Notification.findById(id).populate('sender', 'name email').lean();
    if (!n) return res.status(404).json({ message: 'Notification not found' });
    if (String(n.recipient) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    return res.json({ notification: n });
  } catch (err) {
    console.error('getNotification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Marks one notification as read (auth required)
 */
export async function markAsRead(req, res) {
  const { id } = req.params;
  try {
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    if (String(n.recipient) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    if (!n.read) {
      n.read = true;
      await n.save();
      // emit update to the user's socket room
      emitNotificationUpdate(n.recipient, { id: n._id, read: true });
    }
    return res.json({ message: 'Marked read' });
  } catch (err) {
    console.error('markAsRead error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * PATCH /api/notifications/read-all
 * Marks all unread notifications for the authenticated user as read
 */
export async function markAllRead(req, res) {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    // emit a single event to user's room so clients can clear notifications
    emitNotificationsMarkedAllRead(req.user._id);
    return res.json({ message: 'All marked read' });
  } catch (err) {
    console.error('markAllRead error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification (recipient only)
 */
export async function deleteNotification(req, res) {
  const { id } = req.params;
  try {
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    if (String(n.recipient) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' });
    await n.remove();
    // emit update: notification deleted
    emitNotificationUpdate(n.recipient, { id: n._id, deleted: true });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('deleteNotification error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}

/**
 * GET /api/notifications/unread-count
 * Returns count of unread notifications for the authenticated user
 */
export async function getUnreadCount(req, res) {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, read: false });
    return res.json({ unread: count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
}
