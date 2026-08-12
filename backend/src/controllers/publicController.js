const { GoogleGenerativeAI } = require('@google/generative-ai');
const Asset = require('../models/Asset');
const Issue = require('../models/Issue');
const HistoryLog = require('../models/HistoryLog');


// AI Triage System Prompt definition
const SYSTEM_PROMPT = `
You are an expert maintenance triage engineer for MaintainIQ.
Analyze the user complaint about physical equipment and return structured JSON.

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON (no markdown triple backticks, no preamble text).
2. JSON Schema:
{
  "title": "Short professional issue title (4-8 words)",
  "category": "Appropriate category (HVAC / Cooling, Audio / Visual Display, Electrical & Generator, Plumbing & Sanitation, IT Infrastructure, Safety & Fire Protection, General)",
  "priority": "One of: Low, Medium, High, Critical",
  "possibleCauses": ["Probable cause 1", "Probable cause 2"],
  "initialChecks": ["Safe check 1", "Safe check 2"]
}
3. SAFETY DIRECTIVE: Do NOT provide unsafe instructions for high voltage, gas leakage, pressure vessels, or hazardous mechanical operations. Always include a check advising: "Recommend qualified technician for inspection" on high or critical safety issues.
`;

// Helper: Rule-based fallback if AI API fails or times out
function getFallbackTriage(complaint, assetContext) {
  const text = (complaint || '').toLowerCase();
  let priority = 'Medium';
  let category = assetContext?.category || 'General Equipment';

  if (text.includes('fire') || text.includes('smoke') || text.includes('spark') || text.includes('gas') || text.includes('leak') || text.includes('danger')) {
    priority = 'Critical';
  } else if (text.includes('not working') || text.includes('broken') || text.includes('flicker') || text.includes('no power') || text.includes('dead')) {
    priority = 'High';
  } else if (text.includes('noise') || text.includes('slow') || text.includes('weak')) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  // Capitalize title
  const words = complaint.split(' ').slice(0, 7).join(' ');
  const title = words.length > 5 ? words.charAt(0).toUpperCase() + words.slice(1) : 'Reported Equipment Malfunction';

  return {
    title: title,
    category: category,
    priority: priority,
    possibleCauses: [
      'Component wear or electrical disconnection',
      'Pending routine maintenance service',
      'Environmental or physical obstruction',
    ],
    initialChecks: [
      'Inspect physical cable connections and power switch',
      'Check if unit circuit breaker or fuse is tripped',
      'Recommend qualified technician for on-site inspection',
    ],
    fallbackUsed: true,
  };
}

// @route   POST /api/public/ai-triage
// @desc    Convert natural language complaint into structured AI Triage (Title, Category, Priority, Causes, Checks)
// @access  Public (No Authentication Required)
exports.aiTriageComplaint = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { complaint, assetContext } = req.body;

    if (!complaint || complaint.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed complaint description (minimum 5 characters).',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey.includes('your_gemini_api_key')) {
      console.warn('[AI Triage] GEMINI_API_KEY not configured. Using rule-based triage fallback.');
      const fallback = getFallbackTriage(complaint, assetContext);
      return res.status(200).json({
        success: true,
        aiAssisted: true,
        fallback: true,
        triage: fallback,
      });
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      let model;
      try {
        model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      } catch (mErr1) {
        try {
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-8b' });
        } catch (mErr2) {
          model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        }
      }

      const prompt = `
${SYSTEM_PROMPT}

Asset Context:
Name: ${assetContext?.name || 'Equipment'}
Category: ${assetContext?.category || 'General'}
Location: ${assetContext?.location || 'Facility'}
Condition: ${assetContext?.condition || 'Good'}

User Complaint: "${complaint}"
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      // Clean potential markdown backticks ```json ... ```
      const cleanedJson = responseText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

      let triageData = JSON.parse(cleanedJson);

      // Validate required keys
      if (!triageData.title || !triageData.priority || !Array.isArray(triageData.possibleCauses)) {
        throw new Error('AI response structure invalid');
      }

      return res.status(200).json({
        success: true,
        aiAssisted: true,
        fallback: false,
        triage: {
          title: triageData.title,
          category: triageData.category || assetContext?.category || 'General',
          priority: ['Low', 'Medium', 'High', 'Critical'].includes(triageData.priority) ? triageData.priority : 'Medium',
          possibleCauses: triageData.possibleCauses,
          initialChecks: triageData.initialChecks || ['Inspect unit connections', 'Recommend qualified technician'],
        },
      });
    } catch (aiErr) {
      console.error('[AI SDK Error / JSON Parse Error]:', aiErr.message);
      // Graceful fallback on API error or parsing error
      const fallback = getFallbackTriage(complaint, assetContext);
      return res.status(200).json({
        success: true,
        aiAssisted: true,
        fallback: true,
        triage: fallback,
      });
    }
  } catch (error) {
    console.error('[AI Triage Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'AI Triage processing failed',
    });
  }
};

// @route   GET /api/public/assets/:uniqueCode
// @desc    Public asset lookup with SECURITY STRIPPING of all sensitive data
// @access  Public (No Authentication Required)
exports.getPublicAssetByCode = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const { uniqueCode } = req.params;
    if (!uniqueCode) {
      return res.status(400).json({
        success: false,
        message: 'Asset unique code parameter is required.',
      });
    }

    const cleanCode = uniqueCode.trim().toUpperCase();
    const asset = await Asset.findOne({ uniqueCode: cleanCode });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `No active asset found matching code '${cleanCode}'. Please verify the physical QR label.`,
      });
    }

    // MANDATORY SECURITY RULE: Explicitly construct safe DTO stripping private notes & administrative details
    const safeAsset = {
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
    };

    // Fetch safe activity history (excluding actor names to protect internal privacy)
    let safeHistory = [];
    try {
      const history = await HistoryLog.find({ assetId: asset._id }).sort({ createdAt: -1 });
      safeHistory = history.map(log => ({
        action: log.action,
        createdAt: log.createdAt,
      }));
    } catch (logErr) {
      console.error('[History Retrieve Error]: Failed to fetch history for public display:', logErr);
    }

    return res.status(200).json({
      success: true,
      asset: safeAsset,
      history: safeHistory,
    });

  } catch (error) {
    console.error('[Public Asset Lookup Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve public asset record',
    });
  }
};

// @route   POST /api/public/issues
// @desc    Public issue submission & automatic Asset status update to 'Issue Reported'
// @access  Public (No Authentication Required)
exports.createPublicIssue = async (req, res, next) => {
  res.setHeader('Content-Type', 'application/json');

  try {
    const {
      assetId,
      uniqueCode,
      title,
      description,
      priority,
      category,
      reporterName,
      reporterContact,
      possibleCauses,
      initialChecks,
      aiAssisted,
    } = req.body;

    if (!title || !description || !reporterName || !reporterContact) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, description, reporterName, and reporterContact.',
      });
    }

    // Find Target Asset
    let targetAsset = null;
    if (assetId) {
      targetAsset = await Asset.findById(assetId);
    } else if (uniqueCode) {
      targetAsset = await Asset.findOne({ uniqueCode: uniqueCode.trim().toUpperCase() });
    }

    if (!targetAsset) {
      return res.status(404).json({
        success: false,
        message: 'Target asset not found for issue submission.',
      });
    }

    // Generate unique Issue Number (e.g. ISS-7829)
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const issueNumber = `ISS-${randomCode}`;

    // Create Issue Record with AI triage fields
    const newIssue = await Issue.create({
      issueNumber,
      assetId: targetAsset._id,
      title,
      description,
      priority: priority || 'Medium',
      category: category || targetAsset.category || 'General',
      reporterName,
      reporterContact,
      status: 'Reported',
      possibleCauses: Array.isArray(possibleCauses) ? possibleCauses : [],
      initialChecks: Array.isArray(initialChecks) ? initialChecks : [],
      aiAssisted: Boolean(aiAssisted),
    });

    // MANDATORY WORKFLOW RULE: Automatically update Asset status to 'Issue Reported'
    targetAsset.status = 'Issue Reported';
    await targetAsset.save();

    // Create Immutable History Log for Issue Submission
    try {
      await HistoryLog.create({
        assetId: targetAsset._id,
        issueId: newIssue._id,
        actor: 'Public Reporter',
        action: `Issue Reported: "${title}" (Ticket: ${issueNumber})`,
      });
    } catch (logError) {
      console.error('[History Log Error]: Failed to create log for public issue report:', logError);
    }


    return res.status(201).json({
      success: true,
      message: `Issue ${issueNumber} reported successfully. Asset status updated to 'Issue Reported'.`,
      issue: {
        id: newIssue._id,
        issueNumber: newIssue.issueNumber,
        title: newIssue.title,
        priority: newIssue.priority,
        status: newIssue.status,
        possibleCauses: newIssue.possibleCauses,
        initialChecks: newIssue.initialChecks,
        aiAssisted: newIssue.aiAssisted,
        createdAt: newIssue.createdAt,
      },
      updatedAssetStatus: targetAsset.status,
    });
  } catch (error) {
    console.error('[Create Public Issue Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit public issue report',
    });
  }
};
