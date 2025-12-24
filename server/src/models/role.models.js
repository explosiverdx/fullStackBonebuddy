import mongoose, { Schema } from 'mongoose';

const roleSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  permissions: [
    {
      type: String,
    },
  ],
});

export const Role = mongoose.model('Role', roleSchema);