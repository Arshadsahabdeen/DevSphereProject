import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(token) {
    if (this.socket) return this.socket;

    this.socket = io('http://localhost:5000', {
      autoConnect: false,
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnected = true;
      this.authenticate(token);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    return this.socket;
  }

  authenticate(token) {
    if (this.socket && token) {
      this.socket.emit('authenticate', { token });
    }
  }

  joinRoom(projectId) {
    if (this.socket) {
      this.socket.emit('joinRoom', { projectId });
    }
  }

  leaveRoom(projectId) {
    if (this.socket) {
      this.socket.emit('leaveRoom', { projectId });
    }
  }

  sendMessage(projectId, content) {
    if (this.socket) {
      this.socket.emit('sendMessage', { projectId, content });
    }
  }

  onMessage(callback) {
    if (this.socket) {
      this.socket.on('message', callback);
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback);
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing', callback);
    }
  }

  emitTyping(projectId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { projectId, isTyping });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();