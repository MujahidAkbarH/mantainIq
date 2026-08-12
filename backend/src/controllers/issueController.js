const Issue = require('../models/Issue');
const Asset = require('../models/Asset');
const User = require('../models/User');
const MaintenanceRecord = require('../models/MaintenanceRecord');
const HistoryLog = require('../models/HistoryLog');


// @route   GET /api/issues
// @desc    Get all issues (filterable by status)
// @access  Private (Admin sees all, Technician sees only assigned)
exports.getAllIssues = async (req, res, next) => {
  try {
    const filter = {};
    
    // Role-based scoping
    if (req.user.role === 'Technician') {
      filter.assignedTechnicianId = req.user.id;
    }

    // Status filtering
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const issues = await Issue.find(filter)
      .populate('assetId')
      .populate('assignedTechnicianId', 'name email role')
      .sort({ updatedAt: -1 });

    return res.status(200).json({
      success: true,
      count: issues.length,
      issues,
    });
  } catch (error) {
    console.error('[Get All Issues Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve issues.',
      error: error.message,
    });
  }
};

// @route   GET /api/issues/:id
// @desc    Get a single issue by ID
// @access  Private (With technician ownership check)
exports.getIssueById = async (req, res, next) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('assetId')
      .populate('assignedTechnicianId', 'name email role');

    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found',
      });
    }

    // Enforce technician assignment check
    if (req.user.role === 'Technician' && (!issue.assignedTechnicianId || issue.assignedTechnicianId._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. This issue is not assigned to you.',
      });
    }

    // Fetch maintenance records for this issue if they exist
    const maintenanceRecords = await MaintenanceRecord.find({ issueId: issue._id })
      .populate('technicianId', 'name email');

    return res.status(200).json({
      success: true,
      issue,
      maintenanceRecords,
    });
  } catch (error) {
    console.error('[Get Issue By ID Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch issue details.',
      error: error.message,
    });
  }
};

// @route   PATCH /api/issues/:id/assign
// @desc    Assign an issue to a Technician
// @access  Private (Admin Only)
exports.assignIssue = async (req, res, next) => {
  try {
    const { technicianId } = req.body;

    if (!technicianId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a technician ID for assignment.',
      });
    }

    // Check issue exists
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    // Check technician exists and is a technician
    const technician = await User.findById(technicianId);
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician user record not found.',
      });
    }

    if (technician.role !== 'Technician') {
      return res.status(400).json({
        success: false,
        message: 'Assigned user must have the role of Technician.',
      });
    }

    // Assign and transition status
    issue.assignedTechnicianId = technician._id;
    issue.status = 'Assigned';
    await issue.save();

    console.log(`[Issue Assignment] Issue ${issue.issueNumber} assigned to ${technician.name}`);

    // Create Immutable History Log for Issue Assignment
    try {
      await HistoryLog.create({
        assetId: issue.assetId,
        issueId: issue._id,
        actor: req.user ? req.user.name : 'System',
        action: `Issue Assigned to ${technician.name} (Ticket: ${issue.issueNumber})`,
      });
    } catch (logError) {
      console.error('[History Log Error]: Failed to create log for issue assignment:', logError);
    }

    // Populate and return

    const updatedIssue = await Issue.findById(issue._id)
      .populate('assetId')
      .populate('assignedTechnicianId', 'name email role');

    return res.status(200).json({
      success: true,
      message: `Issue successfully assigned to ${technician.name}. Status updated to 'Assigned'.`,
      issue: updatedIssue,
    });
  } catch (error) {
    console.error('[Assign Issue Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign issue.',
      error: error.message,
    });
  }
};

// @route   PATCH /api/issues/:id/status
// @desc    Progress the status of an issue
// @access  Private (Technician/Admin, Ownership enforced)
exports.updateIssueStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const allowedStatuses = ['Inspection Started', 'Maintenance In Progress', 'Waiting for Parts'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status progression. Allowed: ${allowedStatuses.join(', ')}`,
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    // Technician ownership validation
    if (req.user.role === 'Technician' && (!issue.assignedTechnicianId || issue.assignedTechnicianId.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You can only update status on issues assigned to you.',
      });
    }

    // Update issue status
    issue.status = status;
    await issue.save();

    // Dynamically update the associated Asset's status as a developer value-add
    const asset = await Asset.findById(issue.assetId);
    if (asset) {
      if (status === 'Inspection Started') {
        asset.status = 'Under Inspection';
      } else if (status === 'Maintenance In Progress') {
        asset.status = 'Under Maintenance';
      }
      await asset.save();
      console.log(`[Asset Synced Status] Asset ${asset.uniqueCode} updated to ${asset.status}`);
    }

    // Create Immutable History Log for Status Update
    try {
      await HistoryLog.create({
        assetId: issue.assetId,
        issueId: issue._id,
        actor: req.user ? req.user.name : 'System',
        action: `Status changed to "${status}"`,
      });
    } catch (logError) {
      console.error('[History Log Error]: Failed to create log for status update:', logError);
    }

    return res.status(200).json({

      success: true,
      message: `Issue status updated to '${status}'.`,
      issue,
      assetStatus: asset ? asset.status : null,
    });
  } catch (error) {
    console.error('[Update Issue Status Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update issue status.',
      error: error.message,
    });
  }
};

// @route   POST /api/issues/:id/resolve
// @desc    Submit maintenance resolution details and mark issue resolved
// @access  Private (Technician/Admin, Ownership enforced)
exports.resolveIssue = async (req, res, next) => {
  try {
    const { notes, partsReplaced, cost, finalCondition } = req.body;

    // Backend Validation Checks
    // 1. Text notes validation
    if (!notes || notes.trim() === '') {
      return res.status(400).json({
        success: false,
        message: "An issue cannot be marked 'Resolved' without a text note.",
      });
    }

    // 2. Cost validation
    const parsedCost = Number(cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      return res.status(400).json({
        success: false,
        message: 'Cost cannot be negative.',
      });
    }

    // 3. Final condition validation
    const allowedConditions = ['Good', 'Fair', 'Poor', 'Needs Immediate Maintenance', 'Critical Failure'];
    if (!finalCondition || !allowedConditions.includes(finalCondition)) {
      return res.status(400).json({
        success: false,
        message: `Please specify a valid final asset condition: ${allowedConditions.join(', ')}`,
      });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found.',
      });
    }

    // Technician ownership validation
    if (req.user.role === 'Technician' && (!issue.assignedTechnicianId || issue.assignedTechnicianId.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access forbidden. You can only resolve issues assigned to you.',
      });
    }

    // Handle parts parsing
    let partsArray = [];
    if (Array.isArray(partsReplaced)) {
      partsArray = partsReplaced.map(p => p.trim()).filter(Boolean);
    } else if (typeof partsReplaced === 'string' && partsReplaced.trim() !== '') {
      partsArray = partsReplaced.split(',').map(p => p.trim()).filter(Boolean);
    }

    // Cloudinary URL from file upload middleware
    const evidenceUrl = req.file ? req.file.cloudinaryUrl : '';

    // Create Maintenance Record
    const maintenanceRecord = await MaintenanceRecord.create({
      issueId: issue._id,
      technicianId: req.user.id,
      notes,
      partsReplaced: partsArray,
      cost: parsedCost,
      evidenceUrl,
      finalCondition,
      completedAt: new Date(),
    });

    // Update Issue details & status to 'Resolved'
    issue.status = 'Resolved';
    issue.maintenanceNotes = notes;
    issue.maintenanceCost = parsedCost;
    issue.replacementParts = partsArray.join(', ');
    await issue.save();

    // Update Asset details (Reset status to Operational, update condition, and service dates)
    const asset = await Asset.findById(issue.assetId);
    if (asset) {
      asset.status = 'Operational';
      asset.condition = finalCondition;
      asset.lastServiceDate = new Date();
      await asset.save();
      console.log(`[Asset Operational Reset] Asset ${asset.uniqueCode} reset to Operational with condition ${finalCondition}`);
    }

    // Create Immutable History Log for Issue Resolution
    try {
      await HistoryLog.create({
        assetId: issue.assetId,
        issueId: issue._id,
        actor: req.user ? req.user.name : 'System',
        action: `Issue Resolved (Condition: ${finalCondition})`,
      });
    } catch (logError) {
      console.error('[History Log Error]: Failed to create log for issue resolution:', logError);
    }

    return res.status(200).json({

      success: true,
      message: 'Issue successfully resolved. Asset returned to Operational status.',
      issue,
      maintenanceRecord,
      assetStatus: asset ? asset.status : null,
      cloudinaryWarning: req.file?.cloudinaryError ? `Warning: Cloudinary upload failed (${req.file.cloudinaryError}). Stored fallback URL.` : undefined,
    });
  } catch (error) {
    console.error('[Resolve Issue Error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve issue.',
      error: error.message,
    });
  }
};
