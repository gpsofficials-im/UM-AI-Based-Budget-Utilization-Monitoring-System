import mongoose, { Document, Schema } from 'mongoose';

export type AlertType =
  | 'UNDER_UTILIZATION'
  | 'OVERSPENDING'
  | 'SPENDING_SPIKE'
  | 'BUDGET_DEVIATION';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';

export interface IAlert extends Document {
  alertId: string;
  department: mongoose.Types.ObjectId;
  budget?: mongoose.Types.ObjectId;
  alertType: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  detectedValue: number;
  threshold: number;
  status: AlertStatus;
  acknowledgedBy?: mongoose.Types.ObjectId;
  acknowledgedAt?: Date;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: true,
    },
    budget: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
      default: null,
    },
    alertType: {
      type: String,
      enum: ['UNDER_UTILIZATION', 'OVERSPENDING', 'SPENDING_SPIKE', 'BUDGET_DEVIATION'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    detectedValue: {
      type: Number,
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED'],
      default: 'OPEN',
      required: true,
    },
    acknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

AlertSchema.index({ department: 1, status: 1 });
AlertSchema.index({ alertType: 1, severity: 1 });
AlertSchema.index({ alertId: 1 }, { unique: true });

export const Alert = mongoose.model<IAlert>('Alert', AlertSchema);
