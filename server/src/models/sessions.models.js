import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const sessionSchema = new mongoose.Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    physioId: {
      type: Schema.Types.ObjectId,
      ref: 'Physio',
      required: true,
    },
    surgeryType: {
      type: String,
      required: true,
    },
    amountPaid: {
      type: Number,
      required: true,
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed'],
      default: 'ongoing',
    },
  },
  { timestamps: true }
);

sessionSchema.plugin(mongooseAggregatePaginate);

export const Session = mongoose.model('Session', sessionSchema);