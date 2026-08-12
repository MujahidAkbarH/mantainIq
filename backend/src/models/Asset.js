const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
    },
    uniqueCode: {
      type: String,
      required: [true, 'Unique asset code is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    condition: {
      type: String,
      enum: ['Good', 'Fair', 'Poor', 'Needs Immediate Maintenance', 'Critical Failure'],
      default: 'Good',
    },
    status: {
      type: String,
      enum: {
        values: [
          'Operational',
          'Issue Reported',
          'Under Inspection',
          'Under Maintenance',
          'Out of Service',
          'Retired',
        ],
        message: '{VALUE} is not a valid asset status',
      },
      default: 'Operational',
      required: true,
    },
    lastServiceDate: {
      type: Date,
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
    },
    technicianId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdById: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    qrDataUrl: {
      type: String, // Base64 Data URL representation of QR code
    },
    publicUrl: {
      type: String, // e.g., http://localhost:3000/p/AST-1001
    },
    notes: {
      type: String, // Internal private notes (never exposed on public page)
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Asset', assetSchema);
