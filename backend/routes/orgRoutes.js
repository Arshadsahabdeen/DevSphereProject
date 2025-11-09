import express from "express";
import {
  createOrganization,
  getMyOrganizations,
  assignTeamToOrganization,
  removeTeamFromOrganization,
  deleteOrganization,
} from "../controllers/orgController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create a new organization
router.post("/", protect, createOrganization);

// Get orgs the user belongs to
router.get("/my", protect, getMyOrganizations);

// Assign a team to an organization (head only)
router.post("/:orgId/assign-team", protect, assignTeamToOrganization);

// Remove a team from organization
router.delete("/:orgId/team/:teamId", protect, removeTeamFromOrganization);

// Delete an organization (head only)
router.delete("/:orgId", protect, deleteOrganization);

export default router;
