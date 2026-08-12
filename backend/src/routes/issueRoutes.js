const express = require('express');
const router = express.Router();
const {
  getAllIssues,
  getIssueById,
  assignIssue,
  updateIssueStatus,
  resolveIssue,
} = require('../controllers/issueController');
const { verifyToken, requireAdmin, requireTechnician } = require('../middleware/auth');
const { uploadSingle } = require('../middleware/upload');

// All endpoints require session authentication
router.get('/', verifyToken, getAllIssues);
router.get('/:id', verifyToken, getIssueById);

// Admin-only assignment route
router.patch('/:id/assign', verifyToken, requireAdmin, assignIssue);

// Technician-only work progression and resolution routes
router.patch('/:id/status', verifyToken, requireTechnician, updateIssueStatus);
router.post('/:id/resolve', verifyToken, requireTechnician, uploadSingle, resolveIssue);

module.exports = router;
