import TeamInvite from "../models/TeamInvite.js";
import Team from "../models/Team.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

/** Send invite to team owner */
export const sendTeamInvite = async (req, res) => {
  try {
    const { orgId, teamId } = req.body;
    const org = await Organization.findById(orgId);
    const team = await Team.findById(teamId).populate("owner");

    if (!org || !team)
      return res.status(404).json({ message: "Organization or team not found" });

    if (org.head.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only organization head can send invites" });

    const existing = await TeamInvite.findOne({ organization: orgId, team: teamId, status: "pending" });
    if (existing)
      return res.status(400).json({ message: "Invite already sent for this team" });

    const invite = await TeamInvite.create({
      organization: orgId,
      team: teamId,
      sender: req.user._id,
      receiver: team.owner,
    });

    // If you have a mail service, call it here
    // sendEmail(team.owner.email, "Organization Invite", `${org.name} wants to add your team "${team.name}"`);

    res.status(201).json({ message: "Invite sent successfully", invite });
  } catch (err) {
    console.error("sendTeamInvite error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/** Accept or reject invite */
export const respondToInvite = async (req, res) => {
  try {
    const { inviteId } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    const invite = await TeamInvite.findById(inviteId)
      .populate("organization")
      .populate("team");

    if (!invite) return res.status(404).json({ message: "Invite not found" });

    if (invite.receiver.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "You are not authorized to act on this invite" });

    if (invite.status !== "pending")
      return res.status(400).json({ message: "Invite already handled" });

    if (action === "accept") {
      invite.status = "accepted";
      await invite.save();

      // link team to organization
      const org = await Organization.findById(invite.organization._id);
      if (!org.teams.includes(invite.team._id)) org.teams.push(invite.team._id);
      await org.save();

      invite.team.organization = org._id;
      await invite.team.save();

      res.status(200).json({ message: "Invite accepted, team added to organization" });
    } else {
      invite.status = "rejected";
      await invite.save();
      res.status(200).json({ message: "Invite rejected" });
    }
  } catch (err) {
    console.error("respondToInvite error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
