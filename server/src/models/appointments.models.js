import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    physioId: {
      type: Schema.Types.ObjectId,
      ref: 'Physio',
      required: true,
    },
    appointmentDate: {
      type: Date,
      required: true,
    },
    sessionType: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'canceled'],
      default: 'scheduled',
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

appointmentSchema.plugin(mongooseAggregatePaginate);

export const Appointment = mongoose.model('Appointment', appointmentSchema);