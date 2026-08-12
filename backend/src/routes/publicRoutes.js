const express = require('express');
const router = express.Router();
const { getPublicAssetByCode, createPublicIssue, aiTriageComplaint } = require('../controllers/publicController');

// Public Unauthenticated Routes
router.get('/assets/:uniqueCode', getPublicAssetByCode);
router.post('/issues', createPublicIssue);
router.post('/ai-triage', aiTriageComplaint);

module.exports = router;
