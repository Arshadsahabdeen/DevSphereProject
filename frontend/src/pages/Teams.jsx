import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { teamsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Teams = () => {
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', description: '' });

  const [activeTeam, setActiveTeam] = useState(null); // team object for details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [addMemberForm, setAddMemberForm] = useState({ email: '', role: 'developer' });
  const [updatingTeam, setUpdatingTeam] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchTeams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await teamsAPI.getMyTeams();
      setTeams(res?.data || []);
    } catch (err) {
      console.error('fetchTeams error', err);
      toast.error(err.response?.data?.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (!createForm.name?.trim()) return toast.error('Team name required');
    try {
      const res = await teamsAPI.create({ name: createForm.name.trim(), description: createForm.description || '' });
      toast.success('Team created');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '' });
      // prepend new team to list or refetch
      setTeams(prev => [res.data, ...prev]);
    } catch (err) {
      console.error('create team error', err);
      toast.error(err.response?.data?.message || 'Failed to create team');
    }
  };

  const openDetails = (team) => {
    setActiveTeam(team);
    setAddMemberForm({ email: '', role: 'developer' });
    setShowDetailsModal(true);
  };

  const closeDetails = () => {
    setActiveTeam(null);
    setShowDetailsModal(false);
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!addMemberForm.email?.trim()) return toast.error('Email required');
    if (!activeTeam) return;

    try {
      setUpdatingTeam(true);
      // API expects { email, role } payload per our services/api.js
      const res = await teamsAPI.addMemberByEmail(activeTeam._id, { email: addMemberForm.email.trim(), role: addMemberForm.role });
      toast.success('Member added');
      // Update local activeTeam and teams list with returned team
      const updatedTeam = res.data.team || res.data; // controller returns { message, team } or just team
      setActiveTeam(updatedTeam);
      setTeams(prev => prev.map(t => (t._id === updatedTeam._id ? updatedTeam : t)));
      setAddMemberForm({ email: '', role: 'developer' });
    } catch (err) {
      console.error('add member error', err);
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setUpdatingTeam(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!activeTeam) return;
    if (!confirm('Remove this member from the team?')) return;
    try {
      setUpdatingTeam(true);
      const res = await teamsAPI.removeMember(activeTeam._id, memberId);
      toast.success('Member removed');
      const updatedTeam = res.data.team || activeTeam; // handler returns team
      setActiveTeam(updatedTeam);
      setTeams(prev => prev.map(t => (t._id === updatedTeam._id ? updatedTeam : t)));
    } catch (err) {
      console.error('remove member error', err);
      toast.error(err.response?.data?.message || 'Failed to remove member');
    } finally {
      setUpdatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!confirm('Are you sure you want to delete this team? This cannot be undone.')) return;
    try {
      await teamsAPI.delete(teamId);
      toast.success('Team deleted');
      setTeams(prev => prev.filter(t => t._id !== teamId));
      if (activeTeam?._id === teamId) closeDetails();
    } catch (err) {
      console.error('delete team error', err);
      toast.error(err.response?.data?.message || 'Failed to delete team');
    }
  };

  const handleUpdateTeam = async (teamId, payload) => {
    try {
      setUpdatingTeam(true);
      const res = await teamsAPI.update(teamId, payload);
      toast.success('Team updated');
      const updated = res.data;
      setTeams(prev => prev.map(t => (t._id === updated._id ? updated : t)));
      if (activeTeam && activeTeam._id === updated._id) setActiveTeam(updated);
    } catch (err) {
      console.error('update team error', err);
      toast.error(err.response?.data?.message || 'Failed to update team');
    } finally {
      setUpdatingTeam(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Teams</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchTeams()}
            className="px-3 py-2 border rounded hover:bg-gray-50"
          >
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Create Team
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading teams...</div>
      ) : teams.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-lg font-medium mb-2">No teams yet</h3>
          <p>Create a team to collaborate with others.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => {
            const iAmOwner = String(team.owner?._id || team.owner) === String(user?._id);
            const myMemberObj = (team.members || []).find(m => String(m.user?._id || m.user) === String(user?._id));
            const myRole = myMemberObj?.role || 'guest';

            return (
              <div key={team._id} className="border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{team.name}</h3>
                    <p className="text-sm text-gray-500">{team.description}</p>
                  </div>
                  <div className="text-sm text-right">
                    <div className="text-gray-600">You: <span className="font-medium">{myRole}</span></div>
                    {iAmOwner && <div className="text-xs text-gray-400 mt-1">Owner</div>}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-600">
                    <div>{(team.members || []).length} members</div>
                    <div className="text-xs text-gray-400">Owner: {team.owner?.name || '—'}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDetails(team)}
                      className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200"
                    >
                      View
                    </button>

                    {iAmOwner && (
                      <button
                        onClick={() => handleDeleteTeam(team._id)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded hover:bg-red-100"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create Team</h2>
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Team Name</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Details Modal */}
      {showDetailsModal && activeTeam && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black bg-opacity-40 overflow-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold">{activeTeam.name}</h2>
                <p className="text-sm text-gray-500">{activeTeam.description}</p>
                <div className="text-xs text-gray-400 mt-1">Owner: {activeTeam.owner?.name || '—'}</div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => { closeDetails(); }} className="px-3 py-2 border rounded">Close</button>
              </div>
            </div>

            {/* Add member form (owner/admin) */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-2">Add Member</h3>
              <form onSubmit={handleAddMember} className="flex items-center space-x-2">
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={addMemberForm.email}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  className="flex-1 px-3 py-2 border rounded"
                  required
                />
                <select
                  value={addMemberForm.role}
                  onChange={(e) => setAddMemberForm(prev => ({ ...prev, role: e.target.value }))}
                  className="px-3 py-2 border rounded"
                >
                  <option value="developer">Developer</option>
                  <option value="admin">Admin</option>
                  <option value="guest">Guest</option>
                </select>
                <button type="submit" disabled={updatingTeam} className="px-4 py-2 bg-blue-600 text-white rounded">
                  {updatingTeam ? 'Adding...' : 'Add'}
                </button>
              </form>
            </div>

            {/* Members list */}
            <div>
              <h3 className="text-lg font-medium mb-3">Members</h3>
              <div className="space-y-2">
                {(activeTeam.members || []).map((m) => {
                  const memberId = String(m.user?._id || m.user);
                  const iAmOwner = String(activeTeam.owner?._id || activeTeam.owner) === String(user?._id);
                  const amIRoleAdminOrOwner = (activeTeam.members || []).some(mm => String(mm.user?._id || mm.user) === String(user?._id) && (mm.role === 'owner' || mm.role === 'admin'));
                  const canRemove = amIRoleAdminOrOwner && m.role !== 'owner';

                  return (
                    <div key={memberId} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                      <div>
                        <div className="font-medium">{m.user?.name || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{m.user?.email || ''}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-xs text-gray-600">{m.role}</div>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveMember(memberId)}
                            className="px-3 py-1 text-sm rounded bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Simple update team name/description */}
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Edit Team</h3>
              <EditTeamForm
                team={activeTeam}
                onSave={(payload) => handleUpdateTeam(activeTeam._id, payload)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Small inline component for editing team (keeps parent file simple) */
const EditTeamForm = ({ team, onSave }) => {
  const [form, setForm] = useState({ name: team.name || '', description: team.description || '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({ name: team.name || '', description: team.description || '' });
  }, [team]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name?.trim()) return toast.error('Name required');
    try {
      setSaving(true);
      await onSave({ name: form.name.trim(), description: form.description || '' });
      toast.success('Team updated');
    } catch (err) {
      console.error('edit team save error', err);
      toast.error(err.response?.data?.message || 'Failed to update team');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <input
          value={form.name}
          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <textarea
          value={form.description}
          onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default Teams;
