import mongoose from 'mongoose';
import { Role } from '../models/role.models.js';
import { Permission } from '../models/permission.models.js';
import connectDB from '../db/index.js';
import { DB_NAME } from '../constants.js';

const seedRBAC = async () => {
  try {
    await connectDB();
    console.log('Connected to DB for seeding');

    // Clear existing roles and permissions
    await Role.deleteMany({});
    await Permission.deleteMany({});

    // Create permissions (common ones for admin)
    const permissions = [
      'create:patient', 'read:patient', 'update:patient', 'delete:patient',
      'create:appointment', 'read:appointment', 'update:appointment', 'delete:appointment',
      'create:session', 'read:session', 'update:session', 'delete:session',
      'create:payment', 'read:payment', 'update:payment', 'delete:payment',
      'create:medical_record', 'read:medical_record', 'update:medical_record', 'delete:medical_record',
      'create:progress_report', 'read:progress_report', 'update:progress_report', 'delete:progress_report',
      'read:dashboard', 'create:role', 'create:permission', 'assign:permission',
      'read:user', 'update:user', 'delete:user'
    ];

    const createdPermissions = await Promise.all(
      permissions.map(name => Permission.create({ name, description: `Permission to ${name}` }))
    );
    console.log('Permissions created:', createdPermissions.length);

    // Create admin role and assign all permissions
    const adminRole = await Role.create({
      name: 'admin',
      permissions: permissions // Assign all
    });
    console.log('Admin role created with all permissions');

    // Optionally create other roles (e.g., doctor, patient) with subset permissions
    const doctorRole = await Role.create({
      name: 'doctor',
      permissions: ['read:patient', 'create:medical_record', 'update:medical_record', 'read:session']
    });
    const patientRole = await Role.create({
      name: 'patient',
      permissions: ['read:appointment', 'read:session', 'create:payment']
    });
    const physioRole = await Role.create({
      name: 'physio',
      permissions: ['read:patient', 'create:progress_report', 'update:progress_report', 'read:session']
    });
    const userRole = await Role.create({
      name: 'user',
      permissions: ['read:appointment', 'create:appointment']
    });

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedRBAC();
