const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema(
  {
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      required: [true, 'Associated Issue ID is required'],
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Technician ID is required'],
    },
    notes: {
      type: String,
      required: [true, 'Maintenance notes are required'],
      trim: true,
    },
    partsReplaced: [
      {
        type: String,
        trim: true,
      },
    ],
    cost: {
      type: Number,
      required: [true, 'Maintenance cost is required'],
      min: [0, 'Maintenance cost cannot be negative'],
      default: 0,
    },
    evidenceUrl: {
      type: String,
      default: '',
    },
    finalCondition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Needs Immediate Maintenance', 'Critical Failure'],
      required: [true, 'Final asset condition is required'],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for quicker querying
maintenanceRecordSchema.index({ issueId: 1 });
maintenanceRecordSchema.index({ technicianId: 1 });

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
