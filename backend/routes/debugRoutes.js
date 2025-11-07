import express from 'express';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test route to verify which user the backend recognizes
router.get('/whoami', protect, async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'No user in request' });

  res.json({
    message: 'Current authenticated user info',
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
