import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    age: {
      type: Number,
      required: true,
    },
    mobileNumber: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: false,
    },
    address: {
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
    },
    surgeryType: {
      type: String,
      enum: ['Fracture', 'Knee Replacement', 'Hip Replacement', 'Spine Surgery', 'Other'],
      required: true,
    },
    surgeryDate: {
      type: Date,
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    currentCondition: {
      type: String,
      required: true,
    },
    medicalHistory: {
      type: String,
      required: false,
    },
    allergies: {
      type: String,
      required: false,
    },
    bloodGroup: {
      type: String,
    },
    emergencyContactNumber: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

patientSchema.plugin(mongooseAggregatePaginate);

export const Patient = mongoose.model('Patient', patientSchema);