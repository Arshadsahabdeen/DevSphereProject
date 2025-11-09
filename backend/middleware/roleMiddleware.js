import Team from "../models/Team.js";

export const checkRole = (roles) =>{
    return async (req, res, next) =>{
        try {
            const teamId=req.params.id;
            const team=await Team.findById(teamId);
            if(!team){
                return res.status(404).json({message:"Team not found"});
            }
            const member = team.members.find(
                (m)=>m.user.toString()===req.user.id
            );
            if(!member){
                return res.status(403).json({message:"You are not a member of this team"});
            }
            if(!roles.includes(member.role)){
                return res.status(403).json({message:"Access denied. Insuffecient permissions."})
            }
            next();
        }  catch (error) {
            res.status(500).json({message:"Error checking role",error: error.message});
        }
    };
};