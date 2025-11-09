import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendTeamInvite, respondToInvite } from "../controllers/inviteController.js";

const router = express.Router();

router.post("/send", protect, sendTeamInvite);
router.post("/:inviteId/respond", protect, respondToInvite);

export default router;
