import mongoose, { Schema, Document } from 'mongoose';

export interface IVisitorDoc extends Document {
  id: string;
  name: string;
  phone: string;
  email: string;
  company?: string;
  idType?: string;
  idNumber?: string;
  createdAt: Date;
}

const VisitorSchema = new Schema<IVisitorDoc>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    company: { type: String, trim: true },
    idType: { type: String, default: 'National ID' },
    idNumber: { type: String }
  },
  { timestamps: true }
);

export const VisitorModel = mongoose.models.Visitor || mongoose.model<IVisitorDoc>('Visitor', VisitorSchema);
