import express from 'express';
import {
  createTeam,
  getMyTeams,
  getTeamById,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember
} from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';
import {checkRole} from '../middleware/roleMiddleware.js';

const router = express.Router();

// create a team
router.post('/', protect, createTeam);

// teams user belongs to
router.get('/my', protect, getMyTeams);

// single team (visible only to members)
router.get('/:teamId', protect, getTeamById);

// update team (owner/admin)
router.put('/:teamId', protect,checkRole(['owner','admin']), updateTeam);

// delete team (owner only)
router.delete('/:teamId', protect,checkRole(['owner']), deleteTeam);

// add member by email (owner/admin)
router.post('/:teamId/members', protect, checkRole(['owner','admin']),addMember);

// remove member - option 1: by URL param
router.delete('/:teamId/members/:memberId', checkRole(['owner','admin']), protect, removeMember);

// remove member - option 2: by body { memberId } (same handler)
router.delete('/:teamId/members', protect, checkRole(['owner','admin']),removeMember);

export default router;
