import mongoose ,{Schema} from "mongoose";

const registrationSchema=new mongoose.Schema({
    mobile_number:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    otp:{
        type:String,
        required:true,
        trim:true,
    },
    otpexpire:{
        type:Date,
        required:true
    },
    isVerified:{
        type:Boolean,
        default:false
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

export const Registration =mongoose.model("Registration",registrationSchema)
