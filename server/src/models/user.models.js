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
        required: [true, "Full name is required"],
        trim:true,
        index:true
    },
    gender: {
        type: String,
        enum: ['Male', 'Female', 'Other'],
        required: [true, "Gender is required"]
    },
    dateOfBirth: {
        type: Date,
        required: [true, "Date of birth is required"]
    },
    age: {
        type: Number,
        required: [true, "Age is required"]
    },
    address: {
        city: {
            type: String,
            required: [true, "City is required"]
        },
        state: {
            type: String,
            required: [true, "State is required"]
        },
        pincode: {
            type: String,
            required: [true, "Pincode is required"]
        }
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
    profileCompleted: {
        type: Boolean,
        default: false,
    },
    lastLogin: {
        type: Date,
        default: null,
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


