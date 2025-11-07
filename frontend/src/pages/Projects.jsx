// src/pages/Projects.jsx
import { useState, useEffect } from 'react';
import { projectsAPI, teamsAPI } from '../services/api';
import toast from 'react-hot-toast';
import socketService from '../services/socket';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '', teamId: '' });
  const [myTeams, setMyTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(false);

  // detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removeTeamLoadingId, setRemoveTeamLoadingId] = useState(null);

  useEffect(() => {
    fetchProjects();
    fetchMyTeams();

    // init socket connection and listener for projectAssigned
    const token = localStorage.getItem('token');
    const sock = socketService.connect(token);

    const onAssigned = (payload) => {
      try {
        const projectName = payload?.project?.name || '';
        toast.success(payload?.message || `Assigned: ${projectName}`);
      } catch (e) {
        toast.success('You have been assigned to a new project');
      }
      // refresh to get canonical project data
      fetchProjects();
    };

    socketService.onProjectAssigned(onAssigned);

    return () => {
      // cleanup listener when component unmounts
      socketService.offProjectAssigned(onAssigned);
      // do not disconnect socket globally — other pages might need it
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await projectsAPI.getMine();
      setProjects(res?.data || []);
    } catch (err) {
      console.error('fetchProjects error', err);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyTeams = async () => {
    try {
      setTeamsLoading(true);
      const res = await teamsAPI.getMyTeams();
      setMyTeams(res?.data || []);
    } catch (err) {
      console.error('fetchMyTeams error', err);
      toast.error('Failed to load teams');
    } finally {
      setTeamsLoading(false);
    }
  };

  const createProject = async (payload) => {
    try {
      const body = {
        name: (payload.name || '').trim(),
        description: payload.description || '',
        teamId: payload.teamId ? String(payload.teamId).trim() : '',
      };
      if (!body.name) return toast.error('Project name is required');

      await projectsAPI.create(body);
      toast.success('Project created!');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', teamId: '' });
      fetchProjects();
    } catch (err) {
      console.error('createProject error', err);
      toast.error(err.response?.data?.message || 'Failed to create project');
    }
  };

  const openDetail = async (projectId) => {
    try {
      setShowDetailModal(true);
      setLoadingDetail(true);
      setActiveProject(null);
      const res = await projectsAPI.getById(projectId);
      setActiveProject(res?.data || null);
      // refresh teams in case teams changed
      fetchMyTeams();
    } catch (err) {
      console.error('openDetail error', err);
      toast.error(err.response?.data?.message || 'Failed to load project');
      setShowDetailModal(false);
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setActiveProject(null);
  };

  const handleDelete = async () => {
    if (!activeProject) return;
    if (!confirm('Delete this project? This action cannot be undone.')) return;
    try {
      setDeleting(true);
      await projectsAPI.delete(activeProject._id);
      toast.success('Project deleted');
      closeDetail();
      fetchProjects();
    } catch (err) {
      console.error('deleteProject error', err);
      toast.error(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleAssignTeam = async (teamId) => {
    if (!activeProject || !teamId) return;
    try {
      setAssigning(true);
      const res = await projectsAPI.assignTeam(activeProject._id, teamId);
      // backend may return { message, project } or project directly
      const updated = res?.data?.project || res?.data;
      if (updated) {
        setActiveProject(updated);
        setProjects((prev) => prev.map(p => (p._id === updated._id ? updated : p)));
      } else {
        // fallback: refetch active project
        await openDetail(activeProject._id);
      }
      toast.success('Team assigned to project');
    } catch (err) {
      console.error('assignTeam error', err);
      toast.error(err.response?.data?.message || 'Failed to assign team');
    } finally {
      setAssigning(false);
    }
  };

  const handleRemoveTeam = async (teamId) => {
    if (!activeProject || !teamId) return;
    if (!confirm('Remove this team from the project?')) return;
    try {
      setRemoveTeamLoadingId(teamId);
      const res = await projectsAPI.removeTeam(activeProject._id, teamId);
      const updated = res?.data?.project || res?.data;
      if (updated) {
        setActiveProject(updated);
        setProjects((prev) => prev.map(p => (p._id === updated._id ? updated : p)));
      } else {
        await openDetail(activeProject._id);
      }
      toast.success('Team removed from project');
    } catch (err) {
      console.error('removeTeam error', err);
      toast.error(err.response?.data?.message || 'Failed to remove team');
    } finally {
      setRemoveTeamLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => { fetchProjects(); fetchMyTeams(); }}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Create Project
          </button>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No projects yet</h3>
          <p className="text-gray-500">Create your first project to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project._id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{project.name}</h3>
                <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                  {project.repo?.provider || 'none'}
                </span>
              </div>

              <p className="text-gray-600 mb-4">{project.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {project.teams?.slice(0, 3).map((t, idx) => {
                      const name = typeof t === 'string' ? t : t?.name || '';
                      return (
                        <div
                          key={idx}
                          className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium border-2 border-white"
                          title={name || 'Team'}
                        >
                          {(name || String(t)).charAt(0).toUpperCase()}
                        </div>
                      );
                    })}
                    {project.teams && project.teams.length > 3 && (
                      <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white">
                        +{project.teams.length - 3}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => openDetail(project._id)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create New Project</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await createProject(createForm);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={createForm.name}
                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Team (optional)</label>
                  {teamsLoading ? (
                    <div className="text-sm text-gray-500">Loading teams...</div>
                  ) : myTeams.length === 0 ? (
                    <div className="text-sm text-gray-500">No teams available — you can add one later.</div>
                  ) : (
                    <select
                      value={createForm.teamId}
                      onChange={(e) => setCreateForm({ ...createForm, teamId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg bg-white"
                    >
                      <option value="">-- No team --</option>
                      {myTeams.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <p className="text-xs text-gray-500 mt-1">If selected, project will be created under that team (you must be a member).</p>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black bg-opacity-40 overflow-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl mx-4 mb-8">
            {loadingDetail ? (
              <div className="flex items-center justify-center h-40">
                <div className="text-gray-500">Loading project...</div>
              </div>
            ) : activeProject ? (
              <>
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold">{activeProject.name}</h1>
                    <p className="text-sm text-gray-500">
                      Owner: {activeProject.owner?.name || activeProject.owner?._id || '—'}
                    </p>
                    <p className="text-xs text-gray-400">{new Date(activeProject.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={closeDetail}
                      className="px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-60"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Description</h3>
                  <p className="text-gray-700">{activeProject.description || 'No description provided.'}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Repository</h3>
                  <div className="text-gray-700">
                    <div>Provider: <span className="font-medium">{activeProject.repo?.provider || 'none'}</span></div>
                    {activeProject.repo?.repoUrl && (
                      <div className="mt-1">
                        <a href={activeProject.repo.repoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          {activeProject.repo.repoUrl}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-2">Teams</h3>

                  {/* Assigned teams */}
                  {activeProject.teams && activeProject.teams.length > 0 ? (
                    <div className="flex flex-wrap gap-3 mb-3">
                      {activeProject.teams.map((t) => {
                        const id = typeof t === 'string' ? t : t?._id || t;
                        const name = typeof t === 'string' ? t : t?.name || t?._id || 'Team';
                        return (
                          <div key={id} className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded text-sm">
                            <div>{name}</div>
                            <button
                              onClick={() => handleRemoveTeam(id)}
                              disabled={removeTeamLoadingId === id}
                              className="text-xs text-red-600 hover:underline ml-2"
                            >
                              {removeTeamLoadingId === id ? 'Removing...' : 'Remove'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-3">No teams assigned.</p>
                  )}

                  {/* Assign team dropdown */}
                  <div className="flex items-center space-x-3">
                    <select
                      className="px-3 py-2 border rounded-lg"
                      defaultValue=""
                      onChange={(e) => setActiveProject(prev => ({ ...prev, _pendingAssign: e.target.value }))}
                    >
                      <option value="">Select a team to assign</option>
                      {myTeams.map((t) => (
                        // skip teams already assigned
                        (activeProject.teams || []).some(at => String(at._id || at) === String(t._id)) ? null : (
                          <option key={t._id} value={t._id}>
                            {t.name}
                          </option>
                        )
                      ))}
                    </select>
                    <button
                      onClick={async () => {
                        const teamId = activeProject?._pendingAssign;
                        if (!teamId) return toast.error('Select a team first');
                        await handleAssignTeam(teamId);
                        // clear pending selection
                        setActiveProject(prev => {
                          const copy = { ...prev };
                          delete copy._pendingAssign;
                          return copy;
                        });
                      }}
                      disabled={assigning}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {assigning ? 'Assigning...' : 'Assign Team'}
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Settings</h3>
                  <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto">{JSON.stringify(activeProject.settings || {}, null, 2)}</pre>
                </div>
              </>
            ) : (
              <div className="text-center py-10">
                <div className="text-gray-500">Project not found or you don't have access.</div>
                <div className="mt-4">
                  <button onClick={closeDetail} className="px-3 py-2 bg-blue-600 text-white rounded">Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
