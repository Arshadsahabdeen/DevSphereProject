import mongoose from "mongoose";

const teamInviteSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
  team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // org head
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // team owner
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
}, { timestamps: true });

const TeamInvite = mongoose.model("TeamInvite", teamInviteSchema);
export default TeamInvite;
