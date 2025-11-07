import { useState, useEffect, useRef } from 'react';
import { projectsAPI, messagesAPI } from '../services/api';
import socketService from '../services/socket';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Chat = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState([]);
  const messagesEndRef = useRef(null);
  const { user } = useAuth();

  // normalize user id
  const userId = user?._id || user?.id || null;

  // for deduplication and optimistic updates
  const messageIdsRef = useRef(new Set()); // stores permanent message ids from server
  const clientToTmpIdRef = useRef(new Map()); // map clientId -> tmp message _id

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchProjects();
      setupSocketListeners();
    })();

    return () => {
      mounted = false;
      // leave current room
      if (selectedProject && socketService?.leaveRoom) {
        try { socketService.leaveRoom(selectedProject._id); } catch (e) {}
      }
      // cleanup listeners if socketService provides off handlers
      if (socketService?.offMessage) socketService.offMessage();
      if (socketService?.offTyping) socketService.offTyping();
      if (socketService?.offNotification) socketService.offNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // fetch projects for the authenticated user (owned projects)
      const response = await projectsAPI.getMine();
      const data = response?.data || [];
      setProjects(data);

      // if none selected, pick first
      if (data.length > 0 && !selectedProject) {
        selectProject(data[0]);
      }
    } catch (error) {
      console.error('fetchProjects error', error);
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (project) => {
    try {
      // leave previous room
      if (selectedProject && socketService?.leaveRoom) {
        try { socketService.leaveRoom(selectedProject._id); } catch (e) {}
      }

      setSelectedProject(project);
      setMessages([]);
      messageIdsRef.current.clear();
      clientToTmpIdRef.current.clear();

      // fetch messages from REST API
      try {
        const res = await messagesAPI.getByProject(project._id);
        const msgs = res?.data || [];
        // populate messageIdsRef
        if (Array.isArray(msgs)) {
          msgs.forEach((m) => {
            const id = m._id || m.id || null;
            if (id) messageIdsRef.current.add(String(id));
          });
        }
        setMessages(Array.isArray(msgs) ? msgs : []);
      } catch (err) {
        console.warn('messages fetch failed', err);
        setMessages([]);
      }

      // join new room using socket wrapper
      if (socketService?.joinRoom) {
        try { socketService.joinRoom(project._id); } catch (e) { console.warn('joinRoom failed', e); }
      }
    } catch (err) {
      console.error('selectProject error', err);
      toast.error('Failed to open project chat');
    }
  };

  const setupSocketListeners = () => {
    // Best practice: remove existing handlers before adding new ones to avoid duplicates
    if (socketService?.offMessage) socketService.offMessage();
    if (socketService?.offTyping) socketService.offTyping();
    if (socketService?.offNotification) socketService.offNotification();

    // incoming message
    if (socketService?.onMessage) {
      socketService.onMessage((message) => {
        // Defensive mapping and dedupe
        const incomingId = message?._id || message?.id || null;
        const clientId = message?.clientId || message?.client_id || null;

        // If server attached a permanent id and we've seen it -> ignore duplicate
        if (incomingId && messageIdsRef.current.has(String(incomingId))) return;

        // If server sent clientId and we have an optimistic message for it -> replace it
        if (clientId && clientToTmpIdRef.current.has(clientId)) {
          const tmpId = clientToTmpIdRef.current.get(clientId);
          setMessages((prev) => prev.map((m) => (m._id === tmpId ? { ...message } : m)));
          // move id into seen set and remove client mapping
          if (incomingId) messageIdsRef.current.add(String(incomingId));
          clientToTmpIdRef.current.delete(clientId);
          return;
        }

        // As a final safety: avoid appending an incoming message that's identical to the last message
        // from the same sender within a short time window (2s). This prevents duplicates when server
        // may emit the same message more than once.
        const last = messages[messages.length - 1];
        if (last) {
          const lastText = last.text || last.message || last.content || '';
          const lastSender = (last.from && (last.from._id || last.from.id)) || last.sender || last.user || null;
          const incomingText = message.text || message.message || message.content || '';
          const incomingSender = (message.from && (message.from._id || message.from.id)) || message.sender || message.user || null;
          const lastTime = new Date(last.createdAt || last.created || last.timestamp || Date.now()).getTime();
          const incomingTime = new Date(message.createdAt || message.created || message.timestamp || Date.now()).getTime();

          if (
            String(lastSender) === String(incomingSender) &&
            String((lastText || '').trim()) === String((incomingText || '').trim()) &&
            Math.abs(incomingTime - lastTime) < 2000
          ) {
            // likely duplicate
            // still add id to seen set if present
            if (incomingId) messageIdsRef.current.add(String(incomingId));
            return;
          }
        }

        // otherwise append
        if (incomingId) messageIdsRef.current.add(String(incomingId));
        setMessages((prev) => [...prev, message]);
      });
    }

    // typing indicator
    if (socketService?.onTyping) {
      socketService.onTyping(({ userId: tUserId, name, isTyping }) => {
        // ignore our own typing events
        const myId = userId;
        if (!name || tUserId === myId) return;

        setTyping((prev) => {
          if (isTyping) {
            return prev.includes(name) ? prev : [...prev, name];
          } else {
            return prev.filter((n) => n !== name);
          }
        });
      });
    }

    // notifications
    if (socketService?.onNotification) {
      socketService.onNotification((notification) => {
        toast.success(`New notification: ${notification?.title || notification?.message || 'Event'}`);
      });
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = (newMessage || '').trim();
    if (!text || !selectedProject) return;

    // create a clientId so we can match server-acknowledged message to our optimistic one
    const clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const tmpId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    // optimistic message
    const optimistic = {
      _id: tmpId,
      text,
      createdAt: new Date().toISOString(),
      from: { _id: userId, name: user?.name, email: user?.email },
      clientId,
    };

    // record mapping so we can replace later
    clientToTmpIdRef.current.set(clientId, tmpId);
    // append optimistic immediately
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage('');

    // emit to socket. Try to include clientId so server can echo it back
    try {
      if (socketService?.sendMessage) {
        // prefer an API that accepts (roomId, text, meta)
        try {
          socketService.sendMessage(selectedProject._id, text, { clientId });
        } catch (err) {
          // fallback to older signature
          socketService.sendMessage(selectedProject._id, text);
        }
      } else if (socketService?.emit) {
        socketService.emit('sendMessage', { roomId: selectedProject._id, text, clientId });
      } else {
        console.warn('No socket send API found');
      }
    } catch (err) {
      console.error('send emit error', err);
      toast.error('Failed to send message');
      // on failure keep optimistic message — user can retry or it will stay until refreshed
    }

    // stop typing indicator
    if (socketService?.emitTyping) {
      try { socketService.emitTyping(selectedProject._id, false); } catch (e) {}
    }
  };

  const handleTyping = (e) => {
    const val = e.target.value;
    setNewMessage(val);
    if (!selectedProject) return;
    try {
      if (socketService?.emitTyping) {
        socketService.emitTyping(selectedProject._id, val.length > 0);
      } else if (socketService?.emit) {
        socketService.emit('typing', { userId, name: user?.name, isTyping: val.length > 0, roomId: selectedProject._id });
      }
    } catch (err) {
      // ignore typing emit errors
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // helper to extract sender id/name/text/createdAt defensively
  const normalizeMessage = (message) => {
    if (!message) return { id: '', text: '', senderId: null, senderName: '', createdAt: null };

    const sender = message.from || message.sender || message.user || message.author || null;
    const senderId = sender?._id || sender?.id || sender || null;
    const senderName = sender?.name || sender?.fullName || sender?.email || '';
    const text = message.text || message.content || message.message || message.body || '';
    const createdAt = message.createdAt || message.created_at || message.created || message.timestamp || null;

    return {
      id: message._id || message.id || `${Math.random()}`,
      text,
      senderId,
      senderName,
      createdAt,
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg h-[calc(100vh-8rem)] flex">
      {/* Projects Sidebar */}
      <div className="w-1/4 border-r border-gray-200 p-4 overflow-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Projects</h2>
        <div className="space-y-2">
          {projects.map((project) => (
            <button
              key={project._id}
              onClick={() => selectProject(project)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                selectedProject?._id === project._id
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{project.name}</div>
              <div className="text-sm text-gray-500 truncate">{project.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedProject ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800">{selectedProject.name}</h3>
              <p className="text-sm text-gray-500">{selectedProject.description}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 && <div className="text-center text-gray-400">No messages yet</div>}

              {messages.map((msg) => {
                const m = normalizeMessage(msg);
                const mine = String(m.senderId) === String(userId);
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${mine ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                      {!mine && <div className="text-xs font-medium mb-1">{m.senderName}</div>}
                      <div>{m.text}</div>
                      <div className="text-xs opacity-75 mt-1">{m.createdAt ? new Date(m.createdAt).toLocaleTimeString() : ''}</div>
                    </div>
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {typing.length > 0 && (
                <div className="text-sm text-gray-500 italic">
                  {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500">Select a project to start chatting</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
