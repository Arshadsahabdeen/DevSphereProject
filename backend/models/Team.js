import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'admin', 'developer', 'guest'], default: 'developer' }
}, { _id: false });

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null },
  members: { type: [memberSchema], default: [] },
}, { timestamps: true });

teamSchema.pre("save",function(next){
  if(!this.members.some(m=>m.user.toString()===this.owner.toString())){
    this.members.push({user:this.owner,role:"owner"});
  }
  next();
});

teamSchema.index({ name: 1 });

const Team = mongoose.model("Team", teamSchema);

// ✅ Correct ESM export
export default Team;