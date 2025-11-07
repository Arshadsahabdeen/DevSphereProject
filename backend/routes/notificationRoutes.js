// routes/notificationRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as notificationCtrl from '../controllers/notificationController.js';

const router = express.Router();

router.get('/notifications', protect, notificationCtrl.listNotifications);
router.get('/notifications/unread-count', protect, notificationCtrl.getUnreadCount);
router.post('/notifications', protect, notificationCtrl.createNotification); // if you want auth-protected creation
router.get('/notifications/:id', protect, notificationCtrl.getNotification);
router.patch('/notifications/:id/read', protect, notificationCtrl.markAsRead);
router.patch('/notifications/read-all', protect, notificationCtrl.markAllRead);
router.delete('/notifications/:id', protect, notificationCtrl.deleteNotification);

export default router;
