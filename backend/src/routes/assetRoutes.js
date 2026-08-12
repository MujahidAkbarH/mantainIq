const express = require('express');
const router = express.Router();
const {
  createAsset,
  getAllAssets,
  getAssetById,
  getPublicAssetByCode,
  updateAsset,
  deleteAsset,
  getAssetHistory,
} = require('../controllers/assetController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Public asset lookup route (No Auth required for QR scanners)
router.get('/public/:code', getPublicAssetByCode);

// Protected routes (Authentication Required)
router.get('/', verifyToken, getAllAssets);
router.get('/:id', verifyToken, getAssetById);
router.get('/:uniqueCode/history', verifyToken, getAssetHistory);
router.post('/', verifyToken, createAsset);
router.put('/:id', verifyToken, updateAsset);
router.delete('/:id', verifyToken, requireAdmin, deleteAsset);


module.exports = router;
