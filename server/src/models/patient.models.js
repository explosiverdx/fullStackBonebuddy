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
    state: { type: String, required: false },
    city: { type: String, required: false },
    pincode: { type: String, required: false },
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
      required: false,
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
      required: false,
    },
    medicalInsurance: {
      type: String,
      required: [true, "Medical insurance status is required"],
      enum: ['Yes', 'No'],
      default: 'No'
    },
    medicalReport: {
      type: String,
      required: false,
    },
    medicalReportUploadedByAdmin: {
      type: Boolean,
      default: false,
    },
    medicalReports: [{
      id: { type: String },
      fileUrl: { type: String, required: true },
      uploadedByAdmin: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
      title: { type: String, default: 'Medical Report' },
    }],
  },
  { timestamps: true }
);

patientSchema.plugin(mongooseAggregatePaginate);

export const Patient = mongoose.model('Patient', patientSchema);