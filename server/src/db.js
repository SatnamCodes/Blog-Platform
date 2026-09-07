import mongoose from 'mongoose';
import { env } from './config/env.js';

export async function connectDb(uriOverride) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uriOverride || env.mongoUri);
  return mongoose.connection;
}
