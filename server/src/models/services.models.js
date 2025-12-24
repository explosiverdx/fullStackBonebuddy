import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // Duration in minutes
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

serviceSchema.plugin(mongooseAggregatePaginate);

export const Service = mongoose.model('Service', serviceSchema);