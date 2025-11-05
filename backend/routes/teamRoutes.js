// routes/teamRoutes.js
import express from 'express';
import { createTeam, getMyTeams, addMember } from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createTeam);         // create a team
router.get('/me', protect, getMyTeams);       // teams user belongs to
router.post('/:teamId/members', protect, addMember); // add member by email

export default router;
