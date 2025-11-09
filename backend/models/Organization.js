import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        description: {type:String, default:""},
        head:{type: mongoose.Schema.Types.ObjectId, ref: "User", required:true},
        members:[
            {
                user:{type:mongoose.Schema.Types.ObjectId, ref:"User",required:true},
                role:{
                    type:String,
                    enum:["head","manager","member"],
                    default:"member",
                },
            },
        ],
        teams:[{type:mongoose.Schema.Types.ObjectId,ref:"Team"}],
    },
    {timestamps:true}
);

const Organization = mongoose.model("Organization",organizationSchema);
export default Organization;