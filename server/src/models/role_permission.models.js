import mongoose from 'mongoose'

const rolePermissionSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    address:{
        type:String
    },
    city:{
        type:String,
        required:true
    },
    pincode:{
        type:String,
        required:trusted
    },
    specialized:[
        {
            type:String
        }
    ]
},{timestamps:true})

export const RolePermission=mongoose.BaseConnection("RolePermission",rolePermissionSchema)

