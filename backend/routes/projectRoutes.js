import express from 'express';
import {
  createProject,
  getMyProjects,
  getProjectsByTeam,
  getProjectById,
  updateProject,
  deleteProject,
  assignTeamToProject,
  removeTeamFromProject,
  linkRepo
} from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// create project (optionally under a team)
// POST /api/projects         -> create without team
// POST /api/projects/team/:teamId -> create under team (membership enforced)
router.post('/', protect, createProject);
router.post('/team/:teamId', protect, createProject);

// Get projects owned by the authenticated user only
// GET /api/projects/mine
router.get('/mine', protect, getMyProjects);

// Get projects under a specific team (requires membership)
// GET /api/projects/team/:teamId
router.get('/team/:teamId', protect, getProjectsByTeam);

// Get single project (must be after team routes to avoid param collision)
router.get('/:projectId', protect, getProjectById);

// Update project (owner only)
router.put('/:projectId', protect, updateProject);

// Delete project (owner only)
router.delete('/:projectId', protect, deleteProject);

// Assign / remove team to/from project
router.post('/:projectId/assign-team', protect, assignTeamToProject);
router.post('/:projectId/remove-team', protect, removeTeamFromProject);

// Link repo to project
router.post('/:projectId/link', protect, linkRepo);

export default router;
