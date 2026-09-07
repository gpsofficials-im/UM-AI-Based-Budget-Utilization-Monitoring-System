import mongoose, { Document, Schema } from 'mongoose';

export interface IDepartment extends Document {
  code: string;
  name: string;
  description?: string;
  headOfDepartment?: string;
  contactEmail?: string;
  contactPhone?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const DepartmentSchema = new Schema<IDepartment>(
  {
    code: {
      type: String,
      required: [true, 'Department code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    headOfDepartment: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Department = mongoose.model<IDepartment>('Department', DepartmentSchema);
