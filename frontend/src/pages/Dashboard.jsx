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

  const fetchAll = async () => {
    setLoading(true);
    try {
      // 1) Projects owned by user
      const projectsRes = await projectsAPI.getMine();
      const myProjects = projectsRes?.data || [];
      setProjects(myProjects);

      // 2) Teams the user belongs to
      const teamsRes = await teamsAPI.getMyTeams();
      const myTeams = teamsRes?.data || [];
      setTeams(myTeams);

      // 3) Notifications
      let notifs = [];
      try {
        const nRes = await notificationsAPI.getAll();
        notifs = nRes?.data || [];
      } catch (e) {
        // notifications may be missing on backend; ignore but log
        console.warn('notifications fetch failed', e);
        notifs = [];
      }
      setNotifications(notifs);

      // 4) Messages count: sum messages for each project (best-effort)
      let totalMessages = 0;
      try {
        const msgsPromises = myProjects.map((p) =>
          // messagesAPI.getByProject should return array
          messagesAPI.getByProject(p._id).then((r) => r?.data?.length || 0).catch(() => 0)
        );
        const msgsResults = await Promise.all(msgsPromises);
        totalMessages = msgsResults.reduce((s, c) => s + c, 0);
      } catch (e) {
        console.warn('messages fetch error', e);
        totalMessages = 0;
      }
      setMessagesCount(totalMessages);

      // 5) Unique members across teams
      const memberIds = new Set();
      myTeams.forEach((t) => {
        (t.members || []).forEach((m) => {
          if (m && m.user) memberIds.add(String(m.user._id || m.user));
        });
      });
      setUniqueMembersCount(memberIds.size);

      // 6) Build recent activity: combine recent projects and notifications (by date)
      const activities = [];

      // From projects: creation events
      myProjects.forEach((p) => {
        activities.push({
          type: 'project',
          title: `Project created: ${p.name}`,
          date: p.createdAt ? new Date(p.createdAt) : new Date(),
          meta: { projectId: p._id },
        });
      });

      // From notifications: assume notifications have createdAt and message/ text fields
      notifs.forEach((n) => {
        activities.push({
          type: 'notification',
          title: n.title || n.message || n.text || 'Notification',
          date: n.createdAt ? new Date(n.createdAt) : new Date(),
          meta: { notificationId: n._id },
        });
      });

      // From messages: optionally show last message per project (best-effort)
      try {
        const lastMsgPromises = myProjects.map((p) =>
          messagesAPI.getByProject(p._id).then((r) => {
            const msgs = r?.data || [];
            if (msgs.length === 0) return null;
            const last = msgs[msgs.length - 1];
            return {
              type: 'message',
              title: `Message in ${p.name}: ${last.text?.slice(0, 80) || '...'}${last.text && last.text.length > 80 ? '...' : ''}`,
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
        // ignore
      }

      // sort by date desc and take top 6
      activities.sort((a, b) => b.date - a.date);
      setRecentActivity(activities.slice(0, 6));
    } catch (err) {
      console.error('Dashboard fetchAll error', err);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-gray-500">Loading activity...</div>
            ) : recentActivity.length === 0 ? (
              <div className="text-gray-500">No recent activity</div>
            ) : (
              recentActivity.map((act, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 bg-white rounded border">
                  <div className={`w-2 h-2 rounded-full ${act.type === 'project' ? 'bg-blue-500' : act.type === 'notification' ? 'bg-orange-500' : 'bg-purple-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{act.title}</p>
                    <p className="text-xs text-gray-500">{act.date.toLocaleString()}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
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
  );
};

export default Dashboard;
