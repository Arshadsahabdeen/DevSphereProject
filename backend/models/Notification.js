// models/Notification.js
import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // optional
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // optional context
  type: { type: String, required: true }, // e.g., 'mention','message','invite'
  title: { type: String, required: true },
  body: { type: String, default: '' },
  read: { type: Boolean, default: false },
  meta: { type: Object, default: {} }
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
