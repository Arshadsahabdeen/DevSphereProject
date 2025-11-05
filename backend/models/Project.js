// models/Project.js
import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  repo: {
    provider: { type: String, enum: ['github','gitlab','bitbucket','none'], default: 'none' },
    repoOwner: { type: String },       // e.g., github username/org
    repoName: { type: String },        // e.g., repo slug
    repoUrl: { type: String },
    lastSyncedAt: { type: Date }
  },
  settings: { type: Object, default: {} }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
