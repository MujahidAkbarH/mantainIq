const mongoose = require('mongoose');

const historyLogSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: [true, 'Associated Asset ID is required'],
    },
    issueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Issue',
      default: null,
    },
    actor: {
      type: String,
      required: [true, 'Actor description is required'],
      trim: true,
    },
    action: {
      type: String,
      required: [true, 'Action description is required'],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false, // only need createdAt
  }
);

// Indexes for high performance lookup by asset
historyLogSchema.index({ assetId: 1 });
historyLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('HistoryLog', historyLogSchema);
