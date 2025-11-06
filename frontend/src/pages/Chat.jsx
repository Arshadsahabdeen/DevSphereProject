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

  useEffect(() => {
    fetchProjects();
    setupSocketListeners();
    
    return () => {
      if (selectedProject) {
        socketService.leaveRoom(selectedProject._id);
      }
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProjects = async () => {
    try {
      const response = await projectsAPI.getAll();
      setProjects(response.data);
      if (response.data.length > 0) {
        selectProject(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  const selectProject = async (project) => {
    if (selectedProject) {
      socketService.leaveRoom(selectedProject._id);
    }
    
    setSelectedProject(project);
    setMessages([]);
    
    try {
      const response = await messagesAPI.getByProject(project._id);
      setMessages(response.data);
      socketService.joinRoom(project._id);
    } catch (error) {
      toast.error('Failed to fetch messages');
    }
  };

  const setupSocketListeners = () => {
    socketService.onMessage((message) => {
      setMessages(prev => [...prev, message]);
    });

    socketService.onTyping(({ userId, name, isTyping }) => {
      if (userId === user?.id) return;
      
      setTyping(prev => {
        if (isTyping) {
          return prev.includes(name) ? prev : [...prev, name];
        } else {
          return prev.filter(n => n !== name);
        }
      });
    });

    socketService.onNotification((notification) => {
      toast.success(`New notification: ${notification.title}`);
    });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedProject) return;

    socketService.sendMessage(selectedProject._id, newMessage);
    setNewMessage('');
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (selectedProject) {
      socketService.emitTyping(selectedProject._id, e.target.value.length > 0);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      <div className="w-1/4 border-r border-gray-200 p-4">
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
              <div className="text-sm text-gray-500">{project.description}</div>
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
              <h3 className="text-lg font-semibold text-gray-800">
                {selectedProject.name}
              </h3>
              <p className="text-sm text-gray-500">{selectedProject.description}</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === user?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender._id === user?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.sender._id !== user?.id && (
                      <div className="text-xs font-medium mb-1">
                        {message.sender.name}
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div className="text-xs opacity-75 mt-1">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
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