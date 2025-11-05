// routes/projectRoutes.js
import express from 'express';
import { createProject, getTeamProjects, linkRepo } from '../controllers/projectController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// create project under a team
router.post('/team/:teamId', protect, createProject);

// get team projects
router.get('/team/:teamId', protect, getTeamProjects);

// link repo to a project
router.post('/:projectId/link', protect, linkRepo);

export default router;
