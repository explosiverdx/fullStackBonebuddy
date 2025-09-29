import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const physioSchema = new mongoose.Schema(
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
    qualification: {
      type: String,
      required: true,
    },
    specialization: {
        type: String,
        required: true,
    },
    experience: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

physioSchema.plugin(mongooseAggregatePaginate);

export const Physio = mongoose.model('Physio', physioSchema);