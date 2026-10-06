import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployeeDoc extends Document {
  id: string;
  name: string;
  email: string;
  department: string;
  designation: string;
  phone?: string;
  officeLocation?: string;
  isActive: boolean;
  maxPendingAllowed: number;
}

const EmployeeSchema = new Schema<IEmployeeDoc>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String, required: true },
    designation: { type: String, required: true },
    phone: { type: String },
    officeLocation: { type: String, default: 'Main Office' },
    isActive: { type: Boolean, default: true },
    maxPendingAllowed: { type: Number, default: 3 }
  },
  { timestamps: true }
);

export const EmployeeModel = mongoose.models.Employee || mongoose.model<IEmployeeDoc>('Employee', EmployeeSchema);
