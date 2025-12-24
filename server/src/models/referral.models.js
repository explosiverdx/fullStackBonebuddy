import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const referralSchema = new mongoose.Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctorName: {
      type: String,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientPhone: {
      type: String,
      required: true,
    },
    patientEmail: {
      type: String,
    },
    patientAge: {
      type: Number,
    },
    patientGender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
    },
    condition: {
      type: String,
      required: true,
    },
    surgeryType: {
      type: String,
    },
    surgeryDate: {
      type: Date,
    },
    notes: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'contacted', 'registered', 'rejected'],
      default: 'pending',
    },
    contactedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    contactedAt: {
      type: Date,
    },
    registeredPatientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

referralSchema.plugin(mongooseAggregatePaginate);

export const Referral = mongoose.model('Referral', referralSchema);

