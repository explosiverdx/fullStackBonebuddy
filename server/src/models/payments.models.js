import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const paymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: false,
    },
    sessionId: {
      type: Schema.Types.ObjectId,
      ref: 'Session',
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentType: {
      type: String,
      enum: ['session', 'consultation', 'report', 'other'],
      default: 'other',
    },
    paymentGateway: {
      type: String,
      default: 'simulated',
    },
    transactionId: {
      type: String,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    dueDate: {
      type: Date,
      required: false,
    },
    paidAt: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

paymentSchema.plugin(mongooseAggregatePaginate);

export const Payment = mongoose.model('Payment', paymentSchema);