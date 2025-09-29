import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:false,
        lowercase:true,
        trim:true
    },
    userType: {
        type: String,
        required: true,
        enum: ["admin", "doctor", "patient", "user", "physio"],
        trim:true
    },
    email:{
        type:String,
        required:false,
        lowercase:true,
        trim:true
    },
    Fullname:{
        type:String,
        required:false,
        trim:true,
        index:true
    },
    avatar:{
        type:String,      //cloudinary url
        required:false
    },
    coverImage:{
        type:String        //cloudinary url
    },
    mobile_number:{
        type:String,
        required:true,
        unique:true,
        trim:true,
    },
    password:{
        type:String,
        required:false
    },
    refreshToken:{
        type:String
    },
    otp: {
        type: String,
    },
    otpExpires: {
        type: Date,
    },
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken=function(){
    return jwt.sign(
        {
            _id:this._id,
            email:this.email,
            username:this.username,
            Fullname:this.Fullname
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn:process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken=function(){
    return jwt.sign(
        {
            _id:this._id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn:process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User=mongoose.model("User",userSchema)


