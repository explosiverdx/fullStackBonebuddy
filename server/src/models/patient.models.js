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
      type: String,
      required: false,
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
    hospitalClinic: {
      type: String,
      required: false,
    },
    assignedDoctor: {
      type: String,
      required: false,
    },
    assignedPhysiotherapist: {
      type: String,
      required: false,
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
    medicalInsurance: {
      type: String,
      required: false,
    },
    medicalReport: {
      type: String,
      required: false,
    }
  },
  { timestamps: true }
);

patientSchema.plugin(mongooseAggregatePaginate);

export const Patient = mongoose.model('Patient', patientSchema);