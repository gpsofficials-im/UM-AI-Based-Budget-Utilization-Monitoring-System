import mongoose, { Document, Schema } from 'mongoose';

export type ExpenseCategory =
  | 'CAPITAL'
  | 'OPERATIONAL'
  | 'PROCUREMENT'
  | 'SALARY'
  | 'INFRASTRUCTURE'
  | 'TRAINING'
  | 'MAINTENANCE'
  | 'OTHER';

export type ExpenseStatus = 'RECORDED' | 'VERIFIED' | 'FLAGGED' | 'CANCELLED';

export interface ISupportingDocument {
  originalName: string;
  filename: string;
  path: string;
  mimeType: string;
  size: number;
}

export interface IExpenditure extends Document {
  transactionId: string;
  budget: mongoose.Types.ObjectId;
  department: mongoose.Types.ObjectId;
  amount: number;
  category: ExpenseCategory;
  transactionDate: Date;
  vendorPayee: string;
  description: string;
  supportingDocument?: ISupportingDocument;
  status: ExpenseStatus;
  recordedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupportingDocumentSchema = new Schema<ISupportingDocument>(
  {
    originalName: { type: String, required: true },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

const ExpenditureSchema = new Schema<IExpenditure>(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    budget: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
      required: [true, 'Budget reference is required'],
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department reference is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Expenditure amount is required'],
      min: [0.01, 'Expenditure amount must be strictly greater than 0'],
    },
    category: {
      type: String,
      enum: [
        'CAPITAL',
        'OPERATIONAL',
        'PROCUREMENT',
        'SALARY',
        'INFRASTRUCTURE',
        'TRAINING',
        'MAINTENANCE',
        'OTHER',
      ],
      default: 'OPERATIONAL',
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
      required: true,
    },
    vendorPayee: {
      type: String,
      required: [true, 'Vendor / Payee name is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    supportingDocument: {
      type: SupportingDocumentSchema,
      default: null,
    },
    status: {
      type: String,
      enum: ['RECORDED', 'VERIFIED', 'FLAGGED', 'CANCELLED'],
      default: 'RECORDED',
      required: true,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ExpenditureSchema.index({ department: 1, transactionDate: -1 });
ExpenditureSchema.index({ budget: 1, transactionDate: -1 });
ExpenditureSchema.index({ transactionId: 1 }, { unique: true });

export const Expenditure = mongoose.model<IExpenditure>('Expenditure', ExpenditureSchema);
