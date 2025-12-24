import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/db/index.js';
import { app } from '../src/app.js';
import { User } from '../src/models/user.models.js';
import { Session } from '../src/models/sessions.models.js';
import { Patient } from '../src/models/patient.models.js';
import { Doctor } from '../src/models/doctor.models.js';
import { Physio } from '../src/models/physio.models.js';
import { generateAccessAndRefreshTokens } from '../src/utils/auth.utils.js';

// Small integration test: starts the app, creates an admin user (if needed), obtains token,
// posts a multi-session payload and verifies sessions were created in DB.

dotenv.config({ path: './.env' });

const TEST_PORT = process.env.TEST_PORT || 9100;

const run = async () => {
  console.log('Connecting to DB...');

  let memoryServer = null;
  const mongoUriEnv = process.env.MONGODB_URI;
  const hasValidMongoEnv = typeof mongoUriEnv === 'string' && (mongoUriEnv.startsWith('mongodb://') || mongoUriEnv.startsWith('mongodb+srv://'));

  if (hasValidMongoEnv) {
    // connect using project's connectDB helper which uses MONGODB_URI + DB_NAME
    await connectDB();
  } else {
    // Try to start an in-memory mongo server (optional dependency)
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      console.log('Using in-memory MongoDB at', uri);
      await mongoose.connect(uri, { dbName: 'test' });
    } catch (err) {
      console.error('No valid MONGODB_URI and failed to start in-memory MongoDB.');
      console.error('To run this test, either set MONGODB_URI in .env or install mongodb-memory-server as a dev dependency:');
      console.error('  cd server; npm install --save-dev mongodb-memory-server');
      throw err;
    }
  }

  const server = app.listen(TEST_PORT, '127.0.0.1', () => {
    console.log(`Test server started on port ${TEST_PORT}`);
  });

  try {
    // Ensure there's a patient and admin user present. We'll create a test admin user.
    let admin = await User.findOne({ mobile_number: '9999999990' });
    let createdAdmin = false;
    if (!admin) {
      admin = await User.create({
        mobile_number: '9999999990',
        userType: 'admin',
        username: 'test_admin_9999999990',
        email: 'test_admin_9999999990@example.com',
        Fullname: 'Test Admin',
        address: 'Test',
        age: 30,
        dateOfBirth: new Date('1990-01-01'),
      });
      createdAdmin = true;
    }

    const { accessToken } = await generateAccessAndRefreshTokens(admin._id);

    // Create a test patient
    let patient = await User.findOne({ mobile_number: '9999999991' });
    let createdPatient = false;
    if (!patient) {
      patient = await User.create({
        mobile_number: '9999999991',
        userType: 'patient',
        username: 'test_patient_9999999991',
        email: 'test_patient_9999999991@example.com',
        Fullname: 'Test Patient',
        address: 'Test',
        hospitalName: 'Test Hospital',
        age: 25,
        dateOfBirth: new Date('2000-01-01'),
      });
      createdPatient = true;
    }

    // Ensure we have a doctor and physio as well (simplified: create users with doctor/physio types)
    let doctor = await User.findOne({ mobile_number: '9999999992' });
    if (!doctor) {
      doctor = await User.create({
        mobile_number: '9999999992',
        userType: 'doctor',
        username: 'test_doctor_9999999992',
        email: 'test_doctor_9999999992@example.com',
        Fullname: 'Test Doctor'
        , hospitalName: 'Test Hospital'
      });
    }
    let physio = await User.findOne({ mobile_number: '9999999993' });
    if (!physio) {
      physio = await User.create({
        mobile_number: '9999999993',
        userType: 'physio',
        username: 'test_physio_9999999993',
        email: 'test_physio_9999999993@example.com',
        Fullname: 'Test Physio'
      });
    }

    // Create Patient/Doctor/Physio documents required by controller (they are separate from User)
    let patientDoc = await Patient.findOne({ userId: patient._id });
    if (!patientDoc) {
      patientDoc = await Patient.create({
        userId: patient._id,
        name: patient.Fullname,
        gender: 'Other',
        dateOfBirth: patient.dateOfBirth || new Date('2000-01-01'),
        age: patient.age || 25,
        mobileNumber: patient.mobile_number,
        surgeryType: 'Other',
        surgeryDate: new Date(),
        currentCondition: 'Test',
        emergencyContactNumber: '9999999999'
      });
    }

    let doctorDoc = await Doctor.findOne({ userId: doctor._id });
    if (!doctorDoc) {
      doctorDoc = await Doctor.create({
        userId: doctor._id,
        name: doctor.Fullname,
        qualification: 'MBBS',
        specialization: 'General',
        experience: 5
      });
    }

    let physioDoc = await Physio.findOne({ userId: physio._id });
    if (!physioDoc) {
      physioDoc = await Physio.create({
        userId: physio._id,
        name: physio.Fullname,
        qualification: 'BPT',
        specialization: 'General',
        experience: 3
      });
    }

    // Build two UTC appointment datetimes
    const dt1 = new Date(Date.UTC(2025, 9, 2, 16, 0, 0)).toISOString(); // 2025-10-02 16:00 UTC
    const dt2 = new Date(Date.UTC(2025, 9, 3, 16, 0, 0)).toISOString();

    const payload = {
      // Use the Patient/Doctor/Physio document IDs (not the User IDs)
      patientId: patientDoc._id.toString(),
      doctorId: doctorDoc._id.toString(),
      physioId: physioDoc._id.toString(),
      surgeryType: 'Test Therapy',
      totalSessions: 2,
      sessions: [
        { appointmentDate: dt1 },
        { appointmentDate: dt2 }
      ]
    };

    console.log('Posting payload to allocate-session:', payload);

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/v1/admin/allocate-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    const resJson = await res.json();
    console.log('Response status:', res.status);
    console.log('Response body:', resJson);

    if (res.status !== 201) {
      throw new Error('Expected 201 created from allocate-session');
    }

    // Verify sessions in DB
    const created = resJson.data || resJson;
    if (!Array.isArray(created) || created.length !== 2) {
      throw new Error('Expected 2 created sessions in response');
    }

    // Query DB to ensure sessions exist
  const found = await Session.find({ patientId: patientDoc._id }).where('sessionDate').gte(new Date(dt1)).lte(new Date(dt2));
    console.log('Sessions found in DB for patient:', found.length);
    if (found.length < 2) {
      throw new Error('Created sessions not found in DB');
    }

    console.log('Integration test passed: sessions created and verified in DB.');

    // Cleanup: remove created sessions
    const ids = created.map(s => s._id);
    await Session.deleteMany({ _id: { $in: ids } });

    // Optionally remove created test users (uncomment if desired)
    if (createdAdmin) await User.deleteOne({ _id: admin._id });
    if (createdPatient) await User.deleteOne({ _id: patient._id });

  } catch (err) {
    console.error('Integration test failed:', err);
    process.exitCode = 1;
  } finally {
    server.close(async () => {
      console.log('Test server closed.');
      try {
        await mongoose.disconnect();
        if (memoryServer) await memoryServer.stop();
      } catch (e) {
        // ignore
      }
      process.exit();
    });
  }
};

run();
