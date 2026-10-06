import mongoose, { Schema, Document } from 'mongoose';
import { ActivityAction } from '../../src/types/index.ts';

export interface IActivityLogDoc extends Document {
  id: string;
  visitId: string;
  action: ActivityAction;
  performedBy: {
    id: string;
    name: string;
    role: string;
    email?: string;
  };
  details: string;
  remarks?: string;
  passNumber?: string;
  visitorName?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLogDoc>(
  {
    id: { type: String, required: true, unique: true },
    visitId: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    performedBy: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: { type: String, required: true },
      email: { type: String }
    },
    details: { type: String, required: true },
    remarks: { type: String },
    passNumber: { type: String },
    visitorName: { type: String }
  },
  { timestamps: true }
);

export const ActivityLogModel = mongoose.models.ActivityLog || mongoose.model<IActivityLogDoc>('ActivityLog', ActivityLogSchema);
