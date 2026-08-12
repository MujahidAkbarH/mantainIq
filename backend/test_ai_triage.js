require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runAiTriageTests() {
  console.log('--- STARTING PHASE 5 GENAI ISSUE TRIAGE INTEGRATION TEST ---');
  await connectDB();

  const server = app.listen(5005, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5005');

    try {
      // 1. Setup Admin User & Asset
      console.log('1. Setting up test asset for AI Triage...');
      const adminCreds = {
        name: 'AI Test Admin',
        email: `aiadmin_${Date.now()}@maintainiq.com`,
        password: 'password123',
        role: 'Admin',
      };
      const regRes = await fetch('http://127.0.0.1:5005/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCreds),
      });
      const regData = await regRes.json();
      const token = regData.token;

      const acAsset = {
        name: 'Server Room Main AC Unit',
        uniqueCode: `AC-SR-${Date.now().toString().slice(-4)}`,
        category: 'HVAC / Cooling',
        location: 'Server Room B',
        condition: 'Good',
        status: 'Operational',
      };
      const assetRes = await fetch('http://127.0.0.1:5005/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(acAsset),
      });
      const assetData = await assetRes.json();
      console.log('   ✅ Test AC Asset Registered:', assetData.asset?.uniqueCode);

      // 2. Test AI Triage Endpoint (POST /api/public/ai-triage)
      console.log('\n2. Testing AI Issue Triage Endpoint (POST /api/public/ai-triage)...');
      const complaintText = 'The AC is leaking water, making unusual noise, and cooling is weak.';

      const aiRes = await fetch('http://127.0.0.1:5005/api/public/ai-triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complaint: complaintText,
          assetContext: {
            name: assetData.asset.name,
            category: assetData.asset.category,
            location: assetData.asset.location,
            condition: assetData.asset.condition,
          },
        }),
      });

      const aiData = await aiRes.json();
      console.log('   Status Code:', aiRes.status);
      console.log('   AI Assisted Flag:', aiData.aiAssisted);
      console.log('   Fallback Mode Used:', aiData.fallback);
      console.log('   Generated Triage Title:', aiData.triage?.title);
      console.log('   Suggested Priority:', aiData.triage?.priority);
      console.log('   Possible Causes:', JSON.stringify(aiData.triage?.possibleCauses));
      console.log('   Initial Checks:', JSON.stringify(aiData.triage?.initialChecks));

      if (aiRes.status !== 200 || !aiData.triage?.title || !Array.isArray(aiData.triage?.possibleCauses)) {
        throw new Error('AI Triage failed to return expected JSON structure!');
      }
      console.log('   ✅ AI ISSUE TRIAGE EXECUTED & STRUCTURED JSON RETURNED!');

      // 3. Test Submitting AI-Assisted Reviewed Issue (POST /api/public/issues)
      console.log('\n3. Submitting Reviewed AI-Assisted Issue (POST /api/public/issues)...');
      const issueRes = await fetch('http://127.0.0.1:5005/api/public/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueCode: assetData.asset.uniqueCode,
          title: aiData.triage.title,
          description: complaintText,
          priority: aiData.triage.priority,
          category: aiData.triage.category,
          reporterName: 'Lab Supervisor',
          reporterContact: 'supervisor@maintainiq.com',
          possibleCauses: aiData.triage.possibleCauses,
          initialChecks: aiData.triage.initialChecks,
          aiAssisted: true,
        }),
      });

      const issueData = await issueRes.json();
      console.log('   Status Code:', issueRes.status);
      console.log('   Issue Ticket Number:', issueData.issue?.issueNumber);
      console.log('   AI Assisted Saved Flag:', issueData.issue?.aiAssisted);

      if (issueRes.status !== 201 || issueData.issue?.aiAssisted !== true) {
        throw new Error('Saving AI-assisted issue failed!');
      }
      console.log('   ✅ REVIEWED AI ISSUE SAVED WITH aiAssisted: true & POSSIBLE CAUSES!');

      console.log('\n--- ALL PHASE 5 GENAI ISSUE TRIAGE TESTS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ PHASE 5 TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runAiTriageTests();
