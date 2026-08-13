const QRCode = require('qrcode');
const Asset = require('../models/Asset');
const User = require('../models/User');
const HistoryLog = require('../models/HistoryLog');


// Helper to generate dynamic QR code Data URL
const generateAssetQR = async (uniqueCode) => {
  let clientBase = process.env.CLIENT_URL || 'https://mantain-iq.vercel.app';
  
  // Ensure that we do not use localhost or 127.0.0.1 in the generated QR code URL, falling back to production URL
  if (clientBase.includes('localhost') || clientBase.includes('127.0.0.1')) {
    clientBase = 'https://mantain-iq.vercel.app';
  }

  // Force secure https:// protocol
  if (clientBase.startsWith('http://')) {
    clientBase = clientBase.replace('http://', 'https://');
  } else if (!clientBase.startsWith('https://')) {
    clientBase = `https://${clientBase}`;
  }

  const publicUrl = `${clientBase}/p/${uniqueCode}`;
  
  // Encode ONLY the safe public URL inside the QR code
  const qrDataUrl = await QRCode.toDataURL(publicUrl, {
    margin: 2,
    width: 350,
    color: {
      dark: '#0f172a',
      light: '#ffffff',
    },
  });

  return { publicUrl, qrDataUrl };
};

// @route   POST /api/assets
// @desc    Create a new asset & auto-generate QR code
// @access  Private (Admin / Technician)
exports.createAsset = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { name, uniqueCode, category, location, condition, status, lastServiceDate, nextServiceDate, technicianId, notes } = req.body;

    if (!name || !uniqueCode || !category || !location) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields: name, uniqueCode, category, and location.',
      });
    }

    const cleanCode = uniqueCode.trim().toUpperCase();

    // Check duplicate code
    const existingAsset = await Asset.findOne({ uniqueCode: cleanCode });
    if (existingAsset) {
      return res.status(400).json({
        success: false,
        error: 'Duplicate Code',
        message: `Asset with unique code '${cleanCode}' already exists. Asset codes must be unique.`,
      });
    }

    // Generate safe QR code encoding ONLY public URL
    const { publicUrl, qrDataUrl } = await generateAssetQR(cleanCode);

    const asset = await Asset.create({
      name,
      uniqueCode: cleanCode,
      category,
      location,
      condition: condition || 'Good',
      status: status || 'Operational',
      lastServiceDate: lastServiceDate || new Date(),
      nextServiceDate: nextServiceDate || null,
      technicianId: technicianId || null,
      createdById: req.user ? req.user._id : null,
      qrDataUrl,
      publicUrl,
      notes: notes || '',
    });

    const populatedAsset = await Asset.findById(asset._id).populate('technicianId', 'name email role');

    // Create Immutable History Log
    try {
      await HistoryLog.create({
        assetId: asset._id,
        actor: req.user ? req.user.name : 'System',
        action: 'Asset Registered',
      });
    } catch (logError) {
      console.error('[History Log Error]: Failed to create log for asset registration:', logError);
    }

    return res.status(201).json({

      success: true,
      message: 'Asset created successfully with generated QR Code',
      asset: populatedAsset,
    });
  } catch (error) {
    console.error('[Create Asset Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create asset',
    });
  }
};

// @route   GET /api/assets
// @desc    Get all assets with optional search & filter
// @access  Private
exports.getAllAssets = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { search, status, category } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }
    if (category) {
      filter.category = category;
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { uniqueCode: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const assets = await Asset.find(filter)
      .populate('technicianId', 'name email role')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: assets.length,
      assets,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch assets',
    });
  }
};

// @route   GET /api/assets/public/:code
// @desc    Public route to view safe asset details (No Auth Required)
// @access  Public
exports.getPublicAssetByCode = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { code } = req.params;
    const cleanCode = code.trim().toUpperCase();

    const asset = await Asset.findOne({ uniqueCode: cleanCode });
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: `No asset found with code '${cleanCode}'. Please verify the QR code label.`,
      });
    }

    // Return ONLY safe public details (exclude private notes, internal costs, sensitive dates)
    return res.status(200).json({
      success: true,
      asset: {
        id: asset._id,
        name: asset.name,
        uniqueCode: asset.uniqueCode,
        category: asset.category,
        location: asset.location,
        condition: asset.condition,
        status: asset.status,
        lastServiceDate: asset.lastServiceDate,
        nextServiceDate: asset.nextServiceDate,
        publicUrl: asset.publicUrl,
        qrDataUrl: asset.qrDataUrl,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch public asset page',
    });
  }
};

// @route   GET /api/assets/:id
// @desc    Get single asset by ID
// @access  Private
exports.getAssetById = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const asset = await Asset.findById(req.params.id).populate('technicianId', 'name email role');
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    return res.status(200).json({
      success: true,
      asset,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch asset details',
    });
  }
};

// @route   PUT /api/assets/:id
// @desc    Update asset details (uniqueCode is IMMUTABLE)
// @access  Private (Admin / Technician)
exports.updateAsset = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { name, category, location, condition, status, lastServiceDate, nextServiceDate, technicianId, notes } = req.body;

    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    // Constraint: Prevent mutating uniqueCode to ensure QR mapping never breaks!
    if (name !== undefined) asset.name = name;
    if (category !== undefined) asset.category = category;
    if (location !== undefined) asset.location = location;
    if (condition !== undefined) asset.condition = condition;
    if (status !== undefined) asset.status = status;
    if (lastServiceDate !== undefined) asset.lastServiceDate = lastServiceDate;
    if (nextServiceDate !== undefined) asset.nextServiceDate = nextServiceDate;
    if (technicianId !== undefined) asset.technicianId = technicianId || null;
    if (notes !== undefined) asset.notes = notes;

    await asset.save();

    const updatedAsset = await Asset.findById(asset._id).populate('technicianId', 'name email role');

    return res.status(200).json({
      success: true,
      message: 'Asset updated successfully (QR mapping preserved)',
      asset: updatedAsset,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update asset',
    });
  }
};

// @route   DELETE /api/assets/:id
// @desc    Delete/Retire asset
// @access  Private (Admin Only)
exports.deleteAsset = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Asset '${asset.name}' (${asset.uniqueCode}) removed successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete asset',
    });
  }
};

// @route   GET /api/assets/:uniqueCode/history
// @desc    Get complete history logs of an asset by unique code
// @access  Private (Admin or Technician)
exports.getAssetHistory = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  try {
    const { uniqueCode } = req.params;
    if (!uniqueCode) {
      return res.status(400).json({ success: false, message: 'Unique code is required.' });
    }

    const asset = await Asset.findOne({ uniqueCode: uniqueCode.trim().toUpperCase() });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found.' });
    }

    const history = await HistoryLog.find({ assetId: asset._id })
      .populate('issueId', 'issueNumber title status')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: history.length,
      history,
    });
  } catch (error) {
    console.error('[Get Asset History Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve asset history.',
      error: error.message,
    });
  }
};

