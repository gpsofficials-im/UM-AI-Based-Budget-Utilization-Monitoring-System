import mongoose, { Document, Schema } from 'mongoose';

export interface ISystemConfiguration extends Document {
  underUtilizationThresholdPercent: number; // e.g., 40 (%)
  underUtilizationTimeElapsedThresholdPercent: number; // e.g., 70 (%)
  overspendingThresholdPercent: number; // e.g., 100 (%)
  spendingSpikeMultiplier: number; // e.g., 1.5 (x historical avg)
  budgetDeviationThresholdPercent: number; // e.g., 15 (%)
  autoRunDetectionOnExpenditure: boolean;
  alertNotificationEmail?: string;
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
}

const SystemConfigurationSchema = new Schema<ISystemConfiguration>(
  {
    underUtilizationThresholdPercent: {
      type: Number,
      default: 40,
      min: 1,
      max: 100,
    },
    underUtilizationTimeElapsedThresholdPercent: {
      type: Number,
      default: 70,
      min: 1,
      max: 100,
    },
    overspendingThresholdPercent: {
      type: Number,
      default: 100,
      min: 50,
      max: 200,
    },
    spendingSpikeMultiplier: {
      type: Number,
      default: 1.5,
      min: 1.1,
      max: 10.0,
    },
    budgetDeviationThresholdPercent: {
      type: Number,
      default: 15,
      min: 1,
      max: 100,
    },
    autoRunDetectionOnExpenditure: {
      type: Boolean,
      default: true,
    },
    alertNotificationEmail: {
      type: String,
      default: 'finance-alerts@gov.in',
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SystemConfiguration = mongoose.model<ISystemConfiguration>(
  'SystemConfiguration',
  SystemConfigurationSchema
);
