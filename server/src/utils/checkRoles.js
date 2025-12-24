import dotenv from 'dotenv';
dotenv.config({path:'../.env'});

import mongoose from 'mongoose';
import { Role } from '../models/role.models.js';
import connectDB from '../db/index.js';

async function check() {
  await connectDB();
  const roles = await Role.find({});
  console.log('Roles:', roles.map(r => r.name));
  process.exit(0);
}

check();
