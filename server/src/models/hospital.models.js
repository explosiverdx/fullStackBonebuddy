import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
    },
    city: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    specialized: [
      {
        type: String,
      },
    ],
  },
  { timestamps: true }
);

hospitalSchema.plugin(mongooseAggregatePaginate);

export const Hospital = mongoose.model('Hospital', hospitalSchema);