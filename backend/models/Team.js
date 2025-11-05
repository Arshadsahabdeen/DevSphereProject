// models/Team.js
import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner','admin','developer','guest'], default: 'developer' }
  }],
}, { timestamps: true });

const Team = mongoose.model('Team', teamSchema);
export default Team;
