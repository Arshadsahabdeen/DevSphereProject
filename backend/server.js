// backend/server.js
import 'dotenv/config';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import userRoutes from './routes/userRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import Message from './models/Message.js';
import jwt from 'jsonwebtoken';
import User from './models/User.js';
import debugRoutes from './routes/debugRoutes.js';
import socketManager from './utils/socketManager.js';

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'API is running' });
});

app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api', messageRoutes);
app.use('/api', notificationRoutes);
app.use('/api/debug', debugRoutes);

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // in prod specify your frontend origin
    methods: ['GET','POST']
  }
});

// give controllers access to io via socketManager
socketManager.setIO(io);

// Helper: authenticate socket by sending token in handshake auth: { token }
const getUserFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    return user;
  } catch (err) {
    return null;
  }
};

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  // authenticate on connect (client should emit 'authenticate' with { token })
  socket.on('authenticate', async ({ token }) => {
    const user = await getUserFromToken(token);
    if (!user) {
      socket.emit('unauthorized');
      // don't disconnect forcibly — let client handle; but disconnect to be strict
      try { socket.disconnect(); } catch (e) {}
      return;
    }
    socket.user = user;
    // join user-specific room so server can emit to this user easily
    socket.join(`user-${String(user._id)}`);
    socket.emit('authenticated', { id: user._id, name: user.name });
  });

  // join a project room
  socket.on('joinRoom', ({ projectId }) => {
    if (!projectId) return;
    socket.join(projectId);
    // notify others in room
    socket.to(projectId).emit('userJoined', { userId: socket.user?._id, name: socket.user?.name });
  });

  // leave a project room
  socket.on('leaveRoom', ({ projectId }) => {
    if (!projectId) return;
    socket.leave(projectId);
    socket.to(projectId).emit('userLeft', { userId: socket.user?._id, name: socket.user?.name });
  });

  // typing indicator
  socket.on('typing', ({ projectId, isTyping }) => {
    if (!projectId) return;
    socket.to(projectId).emit('typing', { userId: socket.user?._id, name: socket.user?.name, isTyping });
  });

  // send message (content required)
  socket.on('sendMessage', async ({ projectId, content, meta = {} }) => {
    if (!projectId || !content) return;
    try {
      const userId = socket.user?._id;
      const message = await Message.create({
        project: projectId,
        sender: userId,
        content,
        meta
      });
      const populated = await Message.findById(message._id).populate('sender', 'name email').lean();
      io.to(projectId).emit('message', populated);
    } catch (err) {
      console.error('sendMessage error:', err);
      socket.emit('error', { message: 'Message not saved' });
    }
  });

  // delivered/read/delete handlers (unchanged aside from safety checks)
  socket.on('delivered', async ({ projectId, messageId }) => {
    try {
      if (!messageId) return;
      const msg = await Message.findById(messageId);
      if (!msg) return;
      const uid = socket.user?._id;
      if (uid && !msg.deliveredTo.some(id => id.toString() === uid.toString())) {
        msg.deliveredTo.push(uid);
        await msg.save();
        io.to(projectId).emit('deliveredUpdate', { messageId, userId: uid });
      }
    } catch (err) {
      console.error('delivered handler error:', err);
    }
  });

  socket.on('read', async ({ projectId, messageId, upTo }) => {
    try {
      const uid = socket.user?._id;
      if (!uid) return;

      if (messageId) {
        const msg = await Message.findById(messageId);
        if (!msg) return;
        if (!msg.readBy.some(id => id.toString() === uid.toString())) {
          msg.readBy.push(uid);
          await msg.save();
          io.to(projectId).emit('readUpdate', { messageId, userId: uid });
        }
      } else if (upTo) {
        await Message.updateMany(
          { project: projectId, createdAt: { $lte: new Date(upTo) }, readBy: { $ne: uid } },
          { $push: { readBy: uid } }
        );
        io.to(projectId).emit('readBulk', { projectId, userId: uid, upTo });
      }
    } catch (err) {
      console.error('read handler error:', err);
    }
  });

  socket.on('deleteMessage', async ({ projectId, messageId }) => {
    try {
      const uid = socket.user?._id;
      const msg = await Message.findById(messageId);
      if (!msg) return;

      if (msg.sender.toString() !== uid.toString()) {
        return socket.emit('error', { message: 'Not authorized to delete' });
      }
      msg.deleted = true;
      msg.content = '';
      await msg.save();
      io.to(projectId).emit('messageDeleted', { messageId });
    } catch (err) {
      console.error('deleteMessage handler error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
