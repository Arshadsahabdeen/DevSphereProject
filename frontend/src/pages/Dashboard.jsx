// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectsAPI, teamsAPI, messagesAPI, notificationsAPI } from '../services/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [messagesCount, setMessagesCount] = useState(0);
  const [uniqueMembersCount, setUniqueMembersCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (!user) return;
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // normalize messages response
  const normalizeMessagesResponse = (res) => {
    if (!res) return { messages: [], meta: {} };
    const data = res.data ?? res;

    if (data && typeof data === 'object' && Array.isArray(data.messages)) {
      return { messages: data.messages, meta: data.meta || {} };
    }
    if (Array.isArray(data)) {
      return { messages: data, meta: {} };
    }
    if (data && data.messages && Array.isArray(data.messages)) {
      return { messages: data.messages, meta: data.meta || {} };
    }
    return { messages: [], meta: {} };
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      // Projects
      const projectsRes = await projectsAPI.getMine();
      const myProjects = projectsRes?.data || [];
      setProjects(Array.isArray(myProjects) ? myProjects : []);

      // Teams
      const teamsRes = await teamsAPI.getMyTeams();
      const myTeams = teamsRes?.data || [];
      setTeams(Array.isArray(myTeams) ? myTeams : []);

      // Notifications (fetch page 1)
      let notifs = [];
      try {
        const nRes = await notificationsAPI.getAll({ page: 1, limit: 50 });
        notifs = nRes?.data?.notifications || [];
        if (!Array.isArray(notifs)) notifs = [];
      } catch (e) {
        console.warn('notifications fetch failed', e);
        notifs = [];
      }
      setNotifications(notifs);

      // Messages count
      let totalMessages = 0;
      try {
        const msgsPromises = (myProjects || []).map((p) =>
          messagesAPI
            .getByProject(p._id)
            .then((r) => {
              const { messages, meta } = normalizeMessagesResponse(r);
              if (meta && typeof meta.total === 'number') return meta.total;
              return Array.isArray(messages) ? messages.length : 0;
            })
            .catch(() => 0)
        );
        const msgsResults = await Promise.all(msgsPromises);
        totalMessages = msgsResults.reduce((s, c) => s + (Number(c) || 0), 0);
      } catch (e) {
        console.warn('messages fetch error', e);
        totalMessages = 0;
      }
      setMessagesCount(totalMessages);

      // Unique members
      const memberIds = new Set();
      (myTeams || []).forEach((t) => {
        (t.members || []).forEach((m) => {
          const id = m?.user?._id || m?.user || m?._id || m;
          if (id) memberIds.add(String(id));
        });
      });
      setUniqueMembersCount(memberIds.size);

      // Recent activity
      const activities = [];
      (myProjects || []).forEach((p) => {
        activities.push({
          type: 'project',
          title: `Project created: ${p.name || p.title || 'Untitled'}`,
          date: p.createdAt ? new Date(p.createdAt) : new Date(),
          meta: { projectId: p._id },
        });
      });
      (notifs || []).forEach((n) => {
        activities.push({
          type: 'notification',
          title: n.title || n.message || n.text || 'Notification',
          date: n.createdAt ? new Date(n.createdAt) : new Date(),
          meta: { notificationId: n._id },
        });
      });

      // From messages: show last message per project
      try {
        const lastMsgPromises = (myProjects || []).map((p) =>
          messagesAPI.getByProject(p._id, { limit: 1, page: 1 }).then((r) => {
            const { messages } = normalizeMessagesResponse(r);
            if (!Array.isArray(messages) || messages.length === 0) return null;
            const last = messages[messages.length - 1] || messages[0];
            const snippet = (last.content || last.meta?.snippet || '').toString();
            return {
              type: 'message',
              title: `Message in ${p.name || 'Project'}: ${snippet ? (snippet.slice(0, 80) + (snippet.length > 80 ? '...' : '')) : '...'}`,
              date: last.createdAt ? new Date(last.createdAt) : new Date(),
              meta: { projectId: p._id, messageId: last._id },
            };
          }).catch(() => null)
        );
        const lastMsgs = await Promise.all(lastMsgPromises);
        lastMsgs.forEach((lm) => {
          if (lm) activities.push(lm);
        });
      } catch (e) {
        console.warn('error while fetching last messages', e);
      }

      activities.sort((a, b) => +new Date(b.date) - +new Date(a.date));
      setRecentActivity(activities.slice(0, 100)); // keep last 100 items for scrolling
    } catch (err) {
      console.error('Dashboard fetchAll error', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // MARK SINGLE NOTIFICATION AS READ (optimistic UI)
  const handleMarkAsRead = async (id) => {
    if (!id) return;
    // Optimistically remove notification from UI
    const prev = notifications;
    const next = prev.filter((n) => String(n._id) !== String(id));
    setNotifications(next);

    try {
      await notificationsAPI.markAsRead(id);
      toast.success('Notification marked read');
    } catch (err) {
      // revert on error
      console.warn('markAsRead failed', err);
      setNotifications(prev);
      toast.error('Failed to mark notification read');
    }
  };

  // MARK ALL READ (optimistic)
  const handleMarkAllRead = async () => {
    if (!notifications || notifications.length === 0) return;
    const prev = notifications;
    setNotifications([]); // optimistic: clear UI

    try {
      await notificationsAPI.markAllRead();
      toast.success('All notifications marked read');
    } catch (err) {
      console.warn('markAllRead failed', err);
      setNotifications(prev);
      toast.error('Failed to mark all read');
    }
  };

  // Optionally, you can add a refresh function for notifications
  const refreshNotifications = async () => {
    try {
      const nRes = await notificationsAPI.getAll({ page: 1, limit: 50 });
      const notifs = nRes?.data?.notifications || [];
      setNotifications(Array.isArray(notifs) ? notifs : []);
    } catch (e) {
      console.warn('refreshNotifications failed', e);
    }
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold">Please login to view dashboard</h2>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome back, {user?.name || 'User'}! 👋
        </h1>
        <p className="text-gray-600">Ready to collaborate and build amazing projects together?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Active Projects</p>
              <p className="text-2xl font-bold text-blue-800">{projects.length}</p>
            </div>
            <div className="text-blue-500 text-2xl">📋</div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Team Members</p>
              <p className="text-2xl font-bold text-green-800">{uniqueMembersCount}</p>
            </div>
            <div className="text-green-500 text-2xl">👥</div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Messages</p>
              <p className="text-2xl font-bold text-purple-800">{messagesCount}</p>
            </div>
            <div className="text-purple-500 text-2xl">💬</div>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Notifications</p>
              <p className="text-2xl font-bold text-orange-800">{notifications.length}</p>
            </div>
            <div className="text-orange-500 text-2xl">🔔</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity — scrollable */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            <button
              onClick={() => setRecentActivity([])}
              className="text-sm text-gray-500 hover:text-gray-700"
              title="Clear"
            >
              Clear
            </button>
          </div>

          <div
            tabIndex={0}
            className="space-y-3 max-h-72 overflow-auto focus:outline-none p-1"
            aria-label="Recent activity"
          >
            {loading ? (
              <div className="text-gray-500">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-gray-500">No recent activity</div>
            ) : (
              recentActivity.map((act, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded border">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      act.type === 'project' ? 'bg-blue-500' : act.type === 'notification' ? 'bg-orange-500' : 'bg-purple-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium">{act.title}</p>
                    <p className="text-xs text-gray-500">{act.date ? new Date(act.date).toLocaleString() : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notifications & Quick Actions */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Notifications</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={refreshNotifications}
                className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-100"
              >
                Refresh
              </button>
              <button
                onClick={handleMarkAllRead}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Mark all read
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-72 overflow-auto p-1">
            {notifications.length === 0 ? (
              <div className="text-gray-500">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="flex items-start justify-between p-3 bg-white rounded border">
                  <div className="flex-1 pr-3">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.body || n.meta?.summary || ''}</p>
                    <p className="text-xs text-gray-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <button
                      onClick={() => handleMarkAsRead(n._id)}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark as read
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await notificationsAPI.deleteNotification(n._id);
                          setNotifications((prev) => prev.filter((x) => x._id !== n._id));
                          toast.success('Notification deleted');
                        } catch (err) {
                          toast.error('Delete failed');
                        }
                      }}
                      className="px-2 py-1 text-xs text-red-600 border rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <button
                onClick={() => (window.location.href = '/projects')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors text-left"
              >
                🚀 Create New Project
              </button>
              <button
                onClick={() => (window.location.href = '/teams')}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg transition-colors text-left"
              >
                👥 Invite Team Member
              </button>
              <button
                onClick={() => (window.location.href = '/chat')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg transition-colors text-left"
              >
                💬 Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
