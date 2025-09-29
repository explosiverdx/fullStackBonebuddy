import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const paymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    paymentGateway: {
      type: String,
      default: 'simulated',
    },
    transactionId: {
      type: String,
    },
  },
  { timestamps: true }
);

paymentSchema.plugin(mongooseAggregatePaginate);

export const Payment = mongoose.model('Payment', paymentSchema);