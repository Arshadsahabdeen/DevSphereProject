// controllers/projectController.js
import Project from '../models/Project.js';
import Team from '../models/Team.js';

// Create a project under a team
export const createProject = async (req, res) => {
  const { teamId } = req.params;
  const { name, description } = req.body;
  try {
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // simple membership check
    const mem = team.members.find(m => m.user.toString() === req.user._id.toString());
    if (!mem) return res.status(403).json({ message: 'Not a team member' });

    const project = await Project.create({
      name,
      description,
      team: team._id,
      owner: req.user._id
    });
    res.status(201).json(project);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects for a team
export const getTeamProjects = async (req, res) => {
  const { teamId } = req.params;
  try {
    const projects = await Project.find({ team: teamId }).populate('owner', 'name email').lean();
    res.json(projects);
  } catch (err) {
    console.error('getTeamProjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Link a Git repo to a project (basic)
export const linkRepo = async (req, res) => {
  const { projectId } = req.params;
  const { provider='github', repoOwner, repoName, repoUrl } = req.body;
  try {
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // only project owner or team owner/admin can link
    if (project.owner.toString() !== req.user._id.toString()) {
      // check team roles
      const team = await Team.findById(project.team);
      const mem = team.members.find(m => m.user.toString() === req.user._id.toString());
      if (!mem || (mem.role !== 'owner' && mem.role !== 'admin')) {
        return res.status(403).json({ message: 'Not authorized to link repo' });
      }
    }

    project.repo = { provider, repoOwner, repoName, repoUrl, lastSyncedAt: new Date() };
    await project.save();
    res.json({ message: 'Repo linked', project });
  } catch (err) {
    console.error('linkRepo error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
