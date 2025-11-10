import mongoose, { Schema } from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['payment', 'session', 'report', 'appointment', 'system'],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
    relatedModel: {
      type: String,
      enum: ['Payment', 'Session', 'Report', 'Appointment', null],
      required: false,
    },
    read: {
      type: Boolean,
      default: false,
    },
    actionUrl: {
      type: String,
      required: false,
    },
  },
  { timestamps: true }
);

// Index for faster queries
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);

