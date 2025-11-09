import mongoose from "mongoose";
import Team from "../models/Team.js";
import User from "../models/User.js";


export const createTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Team name required' });

    const team = await Team.create({
      name: name.trim(),
      description: description || '',
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });

    const populated = await Team.findById(team._id).populate('owner', 'name email').populate('members.user', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error('createTeam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teams the user belongs to
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean();
    res.status(200).json(teams);
  } catch (err) {
    console.error('getMyTeams error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get single team (only visible to members)
export const getTeamById = async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });

    const team = await Team.findById(teamId).populate('owner', 'name email').populate('members.user', 'name email').lean();
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isMember = team.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not authorized to view this team' });

    res.status(200).json(team);
  } catch (err) {
    console.error('getTeamById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update team (only owner or admin)
export const updateTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;
    if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const actingMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!actingMember || (actingMember.role !== 'owner' && actingMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to update team' });
    }

    if (name && name.trim()) team.name = name.trim();
    if (description !== undefined) team.description = description;

    await team.save();
    const populated = await Team.findById(team._id).populate('owner', 'name email').populate('members.user', 'name email');
    res.status(200).json(populated);
  } catch (err) {
    console.error('updateTeam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete team (only owner)
export const deleteTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (team.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team owner can delete the team' });
    }

    await team.remove();
    res.status(200).json({ message: 'Team deleted' });
  } catch (err) {
    console.error('deleteTeam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add member to team by email
export const addMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { email, role = 'developer' } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!['owner','admin','developer','guest'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

    if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const actingMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!actingMember || (actingMember.role !== 'owner' && actingMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const already = team.members.find(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'User already a member' });

    team.members.push({ user: user._id, role });
    await team.save();

    const populated = await Team.findById(team._id).populate('owner', 'name email').populate('members.user', 'name email');
    res.status(200).json({ message: 'Member added', team: populated });
  } catch (err) {
    console.error('addMember error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove member from team (only owner or admin)
// Accepts body { memberId } OR URL param /:memberId
export const removeMember = async (req, res) => {
  try {
    const { teamId } = req.params;
    const memberId = req.params.memberId || req.body.memberId;
    if (!memberId) return res.status(400).json({ message: 'memberId required' });
    if (!mongoose.Types.ObjectId.isValid(teamId) || !mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({ message: 'Invalid id(s)' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const actingMember = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!actingMember || (actingMember.role !== 'owner' && actingMember.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to remove members' });
    }

    // Prevent removing owner via this endpoint
    const memberToRemove = team.members.find(m => m.user.toString() === memberId.toString());
    if (!memberToRemove) return res.status(404).json({ message: 'Member not part of team' });
    if (memberToRemove.role === 'owner') return res.status(400).json({ message: 'Cannot remove team owner' });

    team.members = team.members.filter(m => m.user.toString() !== memberId.toString());
    await team.save();

    const populated = await Team.findById(team._id).populate('owner', 'name email').populate('members.user', 'name email');
    res.status(200).json({ message: 'Member removed', team: populated });
  } catch (err) {
    console.error('removeMember error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

