import mongoose from 'mongoose';
import Project from '../models/Project.js';
import Team from '../models/Team.js';

// Create a project (team optional)
// If teamId param provided, create and attach to that team (membership check)
export const createProject = async (req, res) => {
  try {
    const { teamId } = req.params;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    let team = null;
    if (teamId) {
      if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });
      team = await Team.findById(teamId);
      if (!team) return res.status(404).json({ message: 'Team not found' });

      const mem = team.members.find(m => m.user.toString() === req.user._id.toString());
      if (!mem) return res.status(403).json({ message: 'Not a team member' });
    }

    const project = await Project.create({
      name: name.trim(),
      description: description || '',
      team: team ? team._id : null,
      teams: team ? [team._id] : [],
      owner: req.user._id
    });

    const populated = await Project.findById(project._id)
      .populate('owner', 'name email')
      .populate('teams', 'name');
    res.status(201).json(populated);
  } catch (err) {
    console.error('createProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects owned by the authenticated user ONLY
// Route: GET /api/projects/mine
export const getMyProjects = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const projects = await Project.find({ owner: req.user._id })
      .populate('owner', 'name email')
      .populate('teams', 'name')
      .lean();

    res.json(projects);
  } catch (err) {
    console.error('getMyProjects error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get projects under a specific team (requires membership)
// Route: GET /api/projects/team/:teamId
export const getProjectsByTeam = async (req, res) => {
  try {
    const { teamId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(teamId)) return res.status(400).json({ message: 'Invalid teamId' });

    const team = await Team.findById(teamId).lean();
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // membership check: any member can view
    const isMember = team.members.some(m => m.user.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ message: 'Not authorized to view projects for this team' });

    const projects = await Project.find({ $or: [{ team: teamId }, { teams: { $in: [teamId] } }] })
      .populate('owner', 'name email')
      .populate('teams', 'name')
      .lean();

    res.json(projects);
  } catch (err) {
    console.error('getProjectsByTeam error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get a single project (if visible to user)
export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Invalid projectId' });

    const project = await Project.findById(projectId)
      .populate('owner', 'name email')
      .populate('teams', 'name members')
      .lean();
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // check visibility: owner or member of any assigned team
    if (project.owner._id.toString() !== req.user._id.toString()) {
      const memberTeams = await Team.find({ _id: { $in: project.teams }, 'members.user': req.user._id }).select('_id').lean();
      const isMember = memberTeams && memberTeams.length > 0;
      if (!isMember) return res.status(403).json({ message: 'Not authorized to view this project' });
    }

    res.json(project);
  } catch (err) {
    console.error('getProjectById error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project (only owner can update name/description/settings/repo)
export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Invalid projectId' });

    const { name, description, settings, repo } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can update the project' });
    }

    if (name && typeof name === 'string') project.name = name.trim();
    if (description !== undefined) project.description = description;
    if (settings !== undefined) project.settings = settings;
    if (repo !== undefined) project.repo = { ...project.repo, ...repo, lastSyncedAt: repo ? new Date() : project.repo.lastSyncedAt };

    await project.save();
    const populated = await Project.findById(project._id).populate('owner', 'name email').populate('teams', 'name');
    res.json(populated);
  } catch (err) {
    console.error('updateProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project (only owner can delete)
export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      return res.status(400).json({ message: 'Invalid projectId' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only project owner can delete the project' });
    }

    // ✅ FIX: use deleteOne instead of remove
    await project.deleteOne();

    res.json({ message: 'Project deleted successfully' });
  } catch (err) {
    console.error('deleteProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// Assign an existing team to a project (can add multiple teams)
// Authorization: project owner OR team owner/admin can assign that team
export const assignTeamToProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teamId } = req.body;

    if (!teamId) return res.status(400).json({ message: 'teamId is required in body' });
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid id(s)' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    const teamMem = team.members.find(m => m.user.toString() === req.user._id.toString());
    const isTeamAdminOrOwner = teamMem && (teamMem.role === 'owner' || teamMem.role === 'admin');

    if (!isProjectOwner && !isTeamAdminOrOwner) {
      return res.status(403).json({ message: 'Not authorized to assign this team to project' });
    }

    const already = project.teams.find(t => t.toString() === team._id.toString());
    if (already) return res.status(400).json({ message: 'Team already assigned to project' });

    project.teams.push(team._id);
    if (!project.team) project.team = team._id;

    await project.save();
    const populated = await Project.findById(project._id).populate('owner', 'name email').populate('teams', 'name');
    res.json({ message: 'Team assigned to project', project: populated });
  } catch (err) {
    console.error('assignTeamToProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove an assigned team from a project
// Authorization: project owner OR team owner/admin
export const removeTeamFromProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { teamId } = req.body;
    if (!teamId) return res.status(400).json({ message: 'teamId is required in body' });
    if (!mongoose.Types.ObjectId.isValid(projectId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid id(s)' });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    const teamMem = team.members.find(m => m.user.toString() === req.user._id.toString());
    const isTeamAdminOrOwner = teamMem && (teamMem.role === 'owner' || teamMem.role === 'admin');

    if (!isProjectOwner && !isTeamAdminOrOwner) {
      return res.status(403).json({ message: 'Not authorized to remove this team from project' });
    }

    project.teams = project.teams.filter(t => t.toString() !== team._id.toString());
    if (project.team && project.team.toString() === team._id.toString()) {
      project.team = project.teams.length ? project.teams[0] : null;
    }

    await project.save();
    const populated = await Project.findById(project._id).populate('owner', 'name email').populate('teams', 'name');
    res.json({ message: 'Team removed from project', project: populated });
  } catch (err) {
    console.error('removeTeamFromProject error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Link a Git repo to a project (basic) - allow owner or team admin/owner
export const linkRepo = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { provider = 'github', repoOwner, repoName, repoUrl } = req.body;

    if (!mongoose.Types.ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Invalid projectId' });

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isProjectOwner = project.owner.toString() === req.user._id.toString();
    let isAuthorized = isProjectOwner;

    if (!isAuthorized && project.team) {
      const team = await Team.findById(project.team);
      if (team) {
        const mem = team.members.find(m => m.user.toString() === req.user._id.toString());
        if (mem && (mem.role === 'owner' || mem.role === 'admin')) isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ message: 'Not authorized to link repo' });
    }

    project.repo = { provider, repoOwner, repoName, repoUrl, lastSyncedAt: new Date() };
    await project.save();

    const populated = await Project.findById(project._id).populate('owner', 'name email').populate('teams', 'name');
    res.json({ message: 'Repo linked', project: populated });
  } catch (err) {
    console.error('linkRepo error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
