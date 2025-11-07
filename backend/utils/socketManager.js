// backend/utils/socketManager.js
let ioInstance = null;

/**
 * Set the Server (io) instance. Call once from server startup.
 * @param {import('socket.io').Server} io
 */
export const setIO = (io) => {
  ioInstance = io;
};

/**
 * Emit an event to a list of user IDs.
 * Each connected socket should have joined a room named `user-<userId>` (done in server.js on authenticate).
 * @param {Array<string|ObjectId>} userIds
 * @param {string} event
 * @param {any} payload
 */
export const emitToUsers = (userIds = [], event, payload) => {
  if (!ioInstance) {
    console.warn('socketManager: ioInstance not set; cannot emit');
    return;
  }
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  userIds.forEach((uid) => {
    const room = `user-${String(uid)}`;
    ioInstance.to(room).emit(event, payload);
  });
};

/**
 * Emit to a socket.io room directly (useful for project rooms)
 */
export const emitToRoom = (room, event, payload) => {
  if (!ioInstance) return;
  ioInstance.to(room).emit(event, payload);
};

export default {
  setIO,
  emitToUsers,
  emitToRoom
};
