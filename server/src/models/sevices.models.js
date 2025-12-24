import mongoose ,{Schema} from "mongoose";

const servicesSchema=new mongoose.Schema({
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

export const Services =mongoose.model("Services",servicesSchema)
