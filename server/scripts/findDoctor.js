import 'dotenv/config';
import connectDB from '../src/db/index.js';
import { Doctor } from '../src/models/doctor.models.js';

const id = process.argv[2];

(async () => {
  try {
    if (!id) {
      console.error('Usage: node findDoctor.js <doctorId>');
      process.exit(2);
    }
    await connectDB();
    const doc = await Doctor.findById(id).lean();
    if (!doc) {
      console.log(`Doctor ${id} not found`);
      process.exit(0);
    }
    console.log(JSON.stringify(doc, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error querying doctor:', err);
    process.exit(1);
  }
})();