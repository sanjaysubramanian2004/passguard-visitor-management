import mongoose, { Schema, Document } from 'mongoose';
import { VisitStatus, VisitPurpose } from '../../src/types/index.ts';

export interface IVisitDoc extends Document {
  id: string;
  passNumber: string;
  visitorId: string;
  employeeId: string;
  visitDate: string;
  expectedArrivalTime: string;
  expectedDepartureTime?: string;
  purpose: VisitPurpose;
  customPurpose?: string;
  status: VisitStatus;
  remarks?: string;
  approvalRemarks?: string;
  rejectionReason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  registeredBy: {
    id: string;
    name: string;
    role: string;
  };
  approvedBy?: {
    id: string;
    name: string;
    role: string;
    timestamp: string;
  };
  rejectedBy?: {
    id: string;
    name: string;
    role: string;
    timestamp: string;
  };
  checkedInBy?: {
    id: string;
    name: string;
  };
  checkedOutBy?: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const VisitSchema = new Schema<IVisitDoc>(
  {
    id: { type: String, required: true, unique: true },
    passNumber: { type: String, required: true, unique: true },
    visitorId: { type: String, ref: 'Visitor', required: true, index: true },
    employeeId: { type: String, ref: 'Employee', required: true, index: true },
    visitDate: { type: String, required: true, index: true },
    expectedArrivalTime: { type: String, required: true },
    expectedDepartureTime: { type: String },
    purpose: { type: String, required: true },
    customPurpose: { type: String },
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
      default: 'PENDING',
      index: true
    },
    remarks: { type: String },
    approvalRemarks: { type: String },
    rejectionReason: { type: String },
    checkInTime: { type: String },
    checkOutTime: { type: String },
    registeredBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true }
    },
    approvedBy: {
      id: { type: String },
      name: { type: String },
      role: { type: String },
      timestamp: { type: String }
    },
    rejectedBy: {
      id: { type: String },
      name: { type: String },
      role: { type: String },
      timestamp: { type: String }
    },
    checkedInBy: {
      id: { type: String },
      name: { type: String }
    },
    checkedOutBy: {
      id: { type: String },
      name: { type: String }
    }
  },
  { timestamps: true }
);

export const VisitModel = mongoose.models.Visit || mongoose.model<IVisitDoc>('Visit', VisitSchema);
