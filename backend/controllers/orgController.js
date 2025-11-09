import Organization from "../models/Organization.js";
import Team from "../models/Team.js";
import mongoose from "mongoose";

/**
 * Create a new organization
 * Logged-in user automatically becomes 'head'
 */
export const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim())
      return res.status(400).json({ message: "Organization name required" });

    const org = await Organization.create({
      name: name.trim(),
      description: description || "",
      head: req.user._id,
      members: [{ user: req.user._id, role: "head" }],
    });

    const populated = await Organization.findById(org._id)
      .populate("head", "name email")
      .populate("members.user", "name email");

    res.status(201).json(populated);
  } catch (err) {
    console.error("createOrganization error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Get all organizations the user belongs to
 */
export const getMyOrganizations = async (req, res) => {
  try {
    const orgs = await Organization.find({ "members.user": req.user._id })
      .populate("head", "name email _id")
      .populate("members.user", "name email")
      .populate("teams", "name description")
      .lean();

    res.status(200).json(orgs);
  } catch (err) {
    console.error("getMyOrganizations error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Assign an existing team to an organization
 * Only org head can do this
 */
export const assignTeamToOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { teamId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(orgId) ||
      !mongoose.Types.ObjectId.isValid(teamId)
    ) {
      return res.status(400).json({ message: "Invalid ID(s)" });
    }

    const org = await Organization.findById(orgId);
    const team = await Team.findById(teamId);

    if (!org || !team)
      return res
        .status(404)
        .json({ message: "Organization or team not found" });

    if (org.head.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ message: "Only organization head can assign teams" });

    team.organization = org._id;
    await team.save();

    if (!org.teams.includes(team._id)) {
      org.teams.push(team._id);
      await org.save();
    }

    const populated = await Organization.findById(org._id)
      .populate("teams", "name description")
      .populate("head", "name email");

    res.status(200).json({
      message: "Team assigned to organization",
      organization: populated,
    });
  } catch (err) {
    console.error("assignTeamToOrganization error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Remove a team from organization (only head)
 */
export const removeTeamFromOrganization = async (req, res) => {
  try {
    const { orgId, teamId } = req.params;

    const org = await Organization.findById(orgId);
    if (!org) return res.status(404).json({ message: "Organization not found" });

    if (org.head.toString() !== req.user._id.toString())
      return res
        .status(403)
        .json({ message: "Only organization head can remove teams" });

    org.teams = org.teams.filter(
      (t) => t.toString() !== teamId.toString()
    );
    await org.save();

    const team = await Team.findById(teamId);
    if (team && team.organization?.toString() === orgId)
      team.organization = null;
    await team?.save();

    res.status(200).json({ message: "Team removed from organization" });
  } catch (err) {
    console.error("removeTeamFromOrganization error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Delete an organization (only head)
 * This does NOT delete teams, just disassociates them
 */
export const deleteOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const organization = await Organization.findById(orgId);

    if (!organization) {
      return res.status(404).json({ message: "Organization not found" });
    }

    // 🚫 Only the head (creator) can delete
    if (organization.head.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Access denied. Only the organization head can delete this organization." });
    }

    await organization.deleteOne();
    res.status(200).json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("deleteOrganization error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
