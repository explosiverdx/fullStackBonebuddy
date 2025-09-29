import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const progressReportSchema = new mongoose.Schema(
  {
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
    doctorId: {
      type: Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    reportDate: {
      type: Date,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'final'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

progressReportSchema.plugin(mongooseAggregatePaginate);

export const ProgressReport = mongoose.model('ProgressReport', progressReportSchema);