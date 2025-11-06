import express from 'express';
import { registerUser, loginUser, getProfile, updateProfile, getAllUsers } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/', protect, getAllUsers);

export default router;