import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const medicalRecordSchema = new mongoose.Schema(
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
    visitDate: {
      type: Date,
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    treatment: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
    surgeryDetails: {
      type: String,
    },
  },
  { timestamps: true }
);

medicalRecordSchema.plugin(mongooseAggregatePaginate);

export const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);