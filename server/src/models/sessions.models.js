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
    durationMinutes: {
      type: Number,
      default: 60,
    },
    totalSessions: {
      type: Number,
      required: true,
    },
    completedSessions: {
      type: Number,
      default: 0,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['ongoing', 'completed', 'scheduled', 'in-progress', 'cancelled', 'missed'],
      default: 'scheduled',
    },
    startTime: {
      type: Date,
      required: false,
    },
    endTime: {
      type: Date,
      required: false,
    },
    actualDuration: {
      type: Number, // Actual duration in minutes
      required: false,
    },
    sessionVideo: {
      url: {
        type: String,
        required: false,
      },
      publicId: {
        type: String,
        required: false,
      },
      uploadedAt: {
        type: Date,
        required: false,
      },
      uploadedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
      title: {
        type: String,
        required: false,
      },
      description: {
        type: String,
        required: false,
      },
    },
    notes: {
      type: String,
      required: false,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'Payment',
    },
  },
  { timestamps: true }
);

sessionSchema.plugin(mongooseAggregatePaginate);

export const Session = mongoose.model('Session', sessionSchema);