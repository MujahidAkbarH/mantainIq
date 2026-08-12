const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema(
  {
    issueNumber: {
      type: String,
      required: [true, 'Issue number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Associated asset ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Issue title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Issue description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      required: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    reporterName: {
      type: String,
      required: [true, 'Reporter name is required'],
      trim: true,
    },
    reporterContact: {
      type: String,
      required: [true, 'Reporter contact (email or phone) is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'Reported',
        'Assigned',
        'Inspection Started',
        'Maintenance In Progress',
        'Waiting for Parts',
        'Resolved',
        'Closed',
        'Reopened',
      ],
      default: 'Reported',
      required: true,
    },
    assignedTechnicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    maintenanceNotes: {
      type: String,
      default: '',
    },
    possibleCauses: [
      {
        type: String,
      },
    ],
    initialChecks: [
      {
        type: String,
      },
    ],
    aiAssisted: {
      type: Boolean,
      default: false,
    },
    replacementParts: {
      type: String,
      default: '',
    },
    maintenanceCost: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

issueSchema.index({ assetId: 1 });

module.exports = mongoose.model('Issue', issueSchema);
