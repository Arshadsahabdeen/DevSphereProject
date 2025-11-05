// controllers/teamController.js
import Team from '../models/Team.js';
import User from '../models/User.js';

// Create a new team
export const createTeam = async (req, res) => {
  const { name, description } = req.body;
  try {
    const team = await Team.create({
      name,
      description,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'owner' }]
    });
    res.status(201).json(team);
  } catch (err) {
    console.error('createTeam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get teams the user belongs to
export const getMyTeams = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user._id }).populate('owner', 'name email').lean();
    res.json(teams);
  } catch (err) {
    console.error('getMyTeams error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add member to team (invite/quick add)
export const addMember = async (req, res) => {
  const { teamId } = req.params;
  const { email, role = 'developer' } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // only owner or admin can add (simple check)
    const am = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!am || (am.role !== 'owner' && am.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized to add members' });
    }

    const already = team.members.find(m => m.user.toString() === user._id.toString());
    if (already) return res.status(400).json({ message: 'User already a member' });

    team.members.push({ user: user._id, role });
    await team.save();
    res.json({ message: 'Member added', team });
  } catch (err) {
    console.error('addMember error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
