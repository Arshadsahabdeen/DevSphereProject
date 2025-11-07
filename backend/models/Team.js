import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'developer', 'guest'], default: 'developer' }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: { type: [memberSchema], default: [] },
}, { timestamps: true });

teamSchema.index({ name: 1 });

const Team = mongoose.model('Team', teamSchema);
export default Team;
