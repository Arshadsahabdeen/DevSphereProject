// routes/notificationRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// GET /api/notifications - list user's notifications (paginated)
router.get('/notifications', protect, async (req, res) => {
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
    res.json({ notifications: items, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) {
    console.error('list notifications error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/:id/read - mark one as read
router.patch('/notifications/:id/read', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const n = await Notification.findById(id);
    if (!n) return res.status(404).json({ message: 'Not found' });
    if (n.recipient.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });
    n.read = true;
    await n.save();
    res.json({ message: 'Marked read' });
  } catch (err) {
    console.error('mark read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/notifications/read-all - mark all as read
router.patch('/notifications/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: 'All marked read' });
  } catch (err) {
    console.error('mark all read error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
