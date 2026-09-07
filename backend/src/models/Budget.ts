import mongoose, { Document, Schema } from 'mongoose';

export type BudgetQuarter = 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'ANNUAL';
export type BudgetStatus = 'DRAFT' | 'APPROVED' | 'ALLOCATED' | 'REVISED' | 'CLOSED';

export interface IBudget extends Document {
  budgetId: string;
  financialYear: string; // e.g., "2025-26"
  quarter: BudgetQuarter;
  department: mongoose.Types.ObjectId;
  projectScheme: string;
  allocatedAmount: number;
  approvedAmount: number;
  allocationDate: Date;
  status: BudgetStatus;
  description?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    budgetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    financialYear: {
      type: String,
      required: [true, 'Financial year is required (e.g. 2025-26)'],
      trim: true,
      match: [/^\d{4}-\d{2}$/, 'Financial year format must be YYYY-YY (e.g. 2025-26)'],
    },
    quarter: {
      type: String,
      enum: ['Q1', 'Q2', 'Q3', 'Q4', 'ANNUAL'],
      default: 'ANNUAL',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    projectScheme: {
      type: String,
      required: [true, 'Project/Scheme name is required'],
      trim: true,
      maxlength: 200,
    },
    allocatedAmount: {
      type: Number,
      required: [true, 'Allocated amount is required'],
      min: [0, 'Allocated amount must be non-negative'],
    },
    approvedAmount: {
      type: Number,
      required: [true, 'Approved amount is required'],
      min: [0, 'Approved amount must be non-negative'],
    },
    allocationDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'APPROVED', 'ALLOCATED', 'REVISED', 'CLOSED'],
      default: 'ALLOCATED',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.index({ financialYear: 1, department: 1, quarter: 1 });
BudgetSchema.index({ budgetId: 1 }, { unique: true });

export const Budget = mongoose.model<IBudget>('Budget', BudgetSchema);
