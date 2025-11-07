// src/services/socket.js
import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  // connect will create a socket if not present and authenticate using the provided token
  connect(token) {
    if (this.socket) {
      // try to re-authenticate if token changed
      if (token) this.authenticate(token);
      return this.socket;
    }

    // Use environment URL if present, else default to localhost
    const url = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    this.socket = io(url, {
      autoConnect: false,
    });

    this.socket.connect();

    this.socket.on('connect', () => {
      console.log('Socket connected', this.socket.id);
      this.isConnected = true;
      // authenticate if token provided
      if (token) this.authenticate(token);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    // generic error logging
    this.socket.on('error', (err) => {
      console.warn('Socket error', err);
    });

    return this.socket;
  }

  authenticate(token) {
    if (this.socket && token) {
      try {
        this.socket.emit('authenticate', { token });
      } catch (e) {
        console.warn('authenticate emit failed', e);
      }
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
      // keep same shape the server expects
      this.socket.emit('sendMessage', { projectId, content });
    }
  }

  // generic on/off
  on(event, callback) {
    if (this.socket) this.socket.on(event, callback);
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) this.socket.off(event, callback);
      else this.socket.removeAllListeners(event);
    }
  }

  // existing named handlers kept for backwards-compatibility
  onMessage(callback) {
    if (this.socket) this.socket.on('message', callback);
  }

  onNotification(callback) {
    if (this.socket) this.socket.on('notification', callback);
  }

  onTyping(callback) {
    if (this.socket) this.socket.on('typing', callback);
  }

  emitTyping(projectId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { projectId, isTyping });
    }
  }

  // new convenience handlers for the projectAssigned event
  onProjectAssigned(callback) {
    if (this.socket) this.socket.on('projectAssigned', callback);
  }

  offProjectAssigned(callback) {
    if (this.socket) {
      if (callback) this.socket.off('projectAssigned', callback);
      else this.socket.removeAllListeners('projectAssigned');
    }
  }

  disconnect() {
    if (this.socket) {
      try {
        this.socket.disconnect();
      } catch (e) {
        // ignore
      }
      this.socket = null;
      this.isConnected = false;
    }
  }
}

export default new SocketService();
