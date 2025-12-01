import mongoose ,{Schema} from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

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
        required: false
    },
    dateOfBirth: {
        type: Date,
        required: false
    },
    age: {
        type: Number,
        required: false
    },
    address: {
        type: String,
        required: false
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
    // Patient-specific fields
    surgeryType: {
        type: String,
        enum: ['Fracture', 'Knee Replacement', 'Hip Replacement', 'Spine Surgery', 'Other'],
        required: false,
    },
    surgeryDate: {
        type: Date,
        required: false,
    },
    doctorName: {
        type: String,
        required: false,
    },
    hospitalName: {
        type: String,
        required: function() {
            return this.userType === 'patient' || this.userType === 'doctor';
        },
    },
    assignedPhysio: {
        type: String,
        required: false,
    },
    assignedDoctor: {
        type: String,
        required: false,
    },
    medicalReport: {
        type: String, // Cloudinary URL
        required: false,
    },
    currentStatus: {
        type: String,
        enum: ['Pending', 'Active', 'In Treatment', 'Completed'],
        default: 'Pending',
    },
    // Doctor-specific fields
    specialization: {
        type: String,
        required: false,
    },
    experience: {
        type: Number,
        required: false,
    },
    qualification: {
        type: String,
        required: false,
    },
    registrationNumber: {
        type: String,
        required: false,
    },
    availableDays: {
        type: [String],
        required: false,
    },
    availableTimeSlots: {
        type: String,
        required: false,
    },
    consultationFee: {
        type: Number,
        required: false,
    },
    bio: {
        type: String,
        required: false,
    },
    // Admin-specific permissions and visibility settings
    adminPermissions: {
        type: {
            // Dashboard sections visibility
            visibleSections: {
                type: [String],
                default: ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog']
            },
            // Section-level permissions (read-only or editable for each section)
            sectionPermissions: {
                type: Map,
                of: {
                    visible: { type: Boolean, default: true },
                    readOnly: { type: Boolean, default: false }
                },
                default: {}
            },
            // Field-level permissions (read-only or editable)
            fieldPermissions: {
                type: Map,
                of: {
                    visible: { type: Boolean, default: true },
                    readOnly: { type: Boolean, default: false }
                },
                default: {}
            }
        },
        required: false
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

userSchema.plugin(mongooseAggregatePaginate);

export const User=mongoose.model("User",userSchema)
