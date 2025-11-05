// models/Message.js
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, default: '' },
  meta: { type: Object, default: {} }, // optional: { filename, snippet, language, etc }
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // users who received (ack)
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],      // users who read
  deleted: { type: Boolean, default: false },                          // soft delete
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);
export default Message;
