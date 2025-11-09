// backend/routes/messageRoutes.js
import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getByProject,
  getByProjectAlias,
  deleteMessage,
} from '../controllers/messagesController.js';

const router = express.Router();

/**
 * Canonical route: GET /api/projects/:projectId/messages
 * Query params: limit, page, includeDeleted
 */
router.get('/projects/:projectId/messages', protect, getByProject);

/**
 * Compatibility alias: GET /api/messages/:projectId
 * - kept so older frontend paths continue to work
 */
router.get('/messages/:projectId', protect, getByProjectAlias);

/**
 * DELETE /api/messages/:messageId
 */
router.delete('/messages/:messageId', protect, deleteMessage);

export default router;
