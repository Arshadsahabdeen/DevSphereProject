// backend/routes/projectRoutes.js
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

/**
 * Create project
 * - POST /api/projects                -> create without team (owner = req.user)
 * - POST /api/projects/team/:teamId  -> create under a team (membership enforced)
 */
router.post('/', protect, createProject);
router.post('/team/:teamId', protect, createProject);

/**
 * Get projects visible to the authenticated user
 * - Returns projects the user owns OR projects assigned to any team the user is a member of.
 * - GET /api/projects/mine
 */
router.get('/mine', protect, getMyProjects);

/**
 * Get projects for a specific team (requires membership)
 * - GET /api/projects/team/:teamId
 */
router.get('/team/:teamId', protect, getProjectsByTeam);

/**
 * Get a single project (visibility enforced in controller)
 * Note: keep this after /team routes to avoid param collisions.
 * - GET /api/projects/:projectId
 */
router.get('/:projectId', protect, getProjectById);

/**
 * Update / Delete project (owner-only enforced in controller)
 */
router.put('/:projectId', protect, updateProject);
router.delete('/:projectId', protect, deleteProject);

/**
 * Assign / Remove a team to/from a project
 * - POST /api/projects/:projectId/assign-team   -> body: { teamId }
 * - POST /api/projects/:projectId/remove-team   -> body: { teamId }
 *
 * These endpoints enforce that the caller is either the project owner or a team owner/admin.
 * (Using POST here keeps backward compatibility with your existing controllers.)
 */
router.post('/:projectId/assign-team', protect, assignTeamToProject);
router.post('/:projectId/remove-team', protect, removeTeamFromProject);

/**
 * Link a repository to a project (owner or team admin/owner)
 * - POST /api/projects/:projectId/link
 */
router.post('/:projectId/link', protect, linkRepo);

export default router;
