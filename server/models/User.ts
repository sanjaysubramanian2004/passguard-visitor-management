import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../../src/types/index.ts';

export interface IUserDoc extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string;
  department?: string;
  designation?: string;
  isActive: boolean;
  createdAt: Date;
}

const UserSchema = new Schema<IUserDoc>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: 'password123' },
    role: { type: String, enum: ['ADMIN', 'RECEPTIONIST', 'EMPLOYEE'], required: true },
    employeeId: { type: String, ref: 'Employee' },
    department: { type: String },
    designation: { type: String },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);
