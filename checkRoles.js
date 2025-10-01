import dotenv from './server/node_modules/dotenv';
dotenv.config({path:'server/.env'});

import mongoose from 'mongoose';
import { Role } from './server/src/models/role.models.js';
import connectDB from './server/src/db/index.js';

async function check() {
  await connectDB();
  const roles = await Role.find({});
  console.log('Roles:', roles.map(r => r.name));
  process.exit(0);
}

check();
