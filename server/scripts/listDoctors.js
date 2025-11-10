import 'dotenv/config';
import connectDB from '../src/db/index.js';
import { Doctor } from '../src/models/doctor.models.js';

(async () => {
  try {
    await connectDB();
    const docs = await Doctor.find({}).limit(100).lean();
    console.log(JSON.stringify(docs.map(d => ({ _id: d._id, userId: d.userId, name: d.name })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error listing doctors:', err);
    process.exit(1);
  }
})();