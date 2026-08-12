require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runPhase7Tests() {
  console.log('--- STARTING PHASE 7 HISTORICAL TIMELINE SYSTEM TEST ---');
  await connectDB();

  const server = app.listen(5007, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5007');

    try {
      // 1. Create Test Admin & Tech Users
      console.log('1. Registering credentials...');
      const adminEmail = `admin_p7_${Date.now()}@maintainiq.com`;
      const regAdminRes = await fetch('http://127.0.0.1:5007/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'P7 Admin', email: adminEmail, password: 'password123', role: 'Admin' }),
      });
      const adminData = await regAdminRes.json();
      const adminToken = adminData.token;

      const techEmail = `tech_p7_${Date.now()}@maintainiq.com`;
      const regTechRes = await fetch('http://127.0.0.1:5007/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'P7 Tech', email: techEmail, password: 'password123', role: 'Technician' }),
      });
      const techData = await regTechRes.json();
      const techToken = techData.token;
      const techId = techData.user.id;

      if (!adminToken || !techToken) throw new Error('Authentication failed');
      console.log('   ✅ Credentials acquired.');

      // 2. Create Asset and check "Asset Registered" log
      console.log('\n2. Registering asset & verifying creation log...');
      const assetCode = `AST-TML-${Date.now().toString().slice(-4)}`;
      const assetRes = await fetch('http://127.0.0.1:5007/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({
          name: 'Central Server Rack 03',
          uniqueCode: assetCode,
          category: 'IT Infrastructure',
          location: 'Building C - Server Room',
          condition: 'Good',
          status: 'Operational',
        }),
      });
      const assetData = await assetRes.json();
      const assetId = assetData.asset?._id;
      if (!assetId) throw new Error('Asset creation failed');

      // Fetch history immediately
      const hist1Res = await fetch(`http://127.0.0.1:5007/api/assets/${assetCode}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const hist1Data = await hist1Res.json();
      console.log(`   History Count: ${hist1Data.count}`);
      console.log(`   First Log Action: "${hist1Data.history?.[0]?.action}"`);
      console.log(`   First Log Actor: "${hist1Data.history?.[0]?.actor}"`);

      if (hist1Data.count !== 1 || hist1Data.history[0].action !== 'Asset Registered' || hist1Data.history[0].actor !== 'P7 Admin') {
        throw new Error('Asset Registered history log mismatch');
      }
      console.log('   ✅ Creation log matches expected schema.');

      // 3. Submit Public Issue
      console.log('\n3. Reporting issue & verifying public timeline safe projection...');
      const issueRes = await fetch('http://127.0.0.1:5007/api/public/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uniqueCode: assetCode,
          title: 'Power supply unit fault',
          description: 'Power supply is chirping and red warning LED is glowing.',
          priority: 'High',
          category: 'IT Infrastructure',
          reporterName: 'Lab Admin Ali',
          reporterContact: 'ali@server.com',
        }),
      });
      const issueData = await issueRes.json();
      const issueId = issueData.issue?.id || issueData.issue?._id;
      const issueCode = issueData.issue?.issueNumber;
      if (!issueId) throw new Error('Issue reporting failed');

      // Fetch public asset details
      const publicAssetRes = await fetch(`http://127.0.0.1:5007/api/public/assets/${assetCode}`);
      const publicAssetData = await publicAssetRes.json();
      console.log(`   Public Safe History Array Length: ${publicAssetData.history?.length}`);
      console.log(`   Public Safe Log action: "${publicAssetData.history?.[0]?.action}"`);
      console.log(`   Public Safe Log keys:`, Object.keys(publicAssetData.history?.[0] || {}));

      if (publicAssetData.history?.length !== 2) {
        throw new Error('Public history timeline length mismatch');
      }

      if (publicAssetData.history[0].actor !== undefined || Object.keys(publicAssetData.history[0]).includes('actor')) {
        throw new Error('SECURITY VIOLATION: Public projection leaks actor identity!');
      }
      console.log('   ✅ Security projection verified: actor names are stripped from public lookup.');

      // 4. Assign Issue to Tech
      console.log('\n4. Assigning issue & checking log...');
      await fetch(`http://127.0.0.1:5007/api/issues/${issueId}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ technicianId: techId }),
      });

      // 5. Update Status
      console.log('\n5. Progressing status to Inspection & checking log...');
      await fetch(`http://127.0.0.1:5007/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${techToken}` },
        body: JSON.stringify({ status: 'Inspection Started' }),
      });

      // 6. Resolve Issue
      console.log('\n6. Resolving issue & checking log...');
      await fetch(`http://127.0.0.1:5007/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${techToken}` },
        body: JSON.stringify({
          notes: 'Replaced faulty redundant power supply.',
          partsReplaced: 'Redundant PSU 800W',
          cost: 299.99,
          finalCondition: 'Good',
        }),
      });

      // 7. Verify complete timeline
      console.log('\n7. Auditing full internal lifecycle timeline logs...');
      const finalHistRes = await fetch(`http://127.0.0.1:5007/api/assets/${assetCode}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const finalHistData = await finalHistRes.json();
      console.log(`   Total Logs Recorded: ${finalHistData.count}`);
      finalHistData.history.forEach((log, idx) => {
        console.log(`     Log #${finalHistData.count - idx}: [${log.actor}] -> "${log.action}"`);
      });

      if (finalHistData.count !== 5) {
        throw new Error('Timeline entry count mismatch: Expected 5 log logs.');
      }
      console.log('   ✅ Timeline entries tracked sequentially.');

      // 8. Confirm PUT/DELETE immutability constraints
      console.log('\n8. Probing PUT/DELETE operations on history endpoints...');
      const deleteRes = await fetch(`http://127.0.0.1:5007/api/assets/${assetCode}/history`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`   DELETE status: ${deleteRes.status} (Expected 404)`);

      const putRes = await fetch(`http://127.0.0.1:5007/api/assets/${assetCode}/history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ action: 'Malicious Mutation' }),
      });
      console.log(`   PUT status: ${putRes.status} (Expected 404)`);

      if (deleteRes.status !== 404 || putRes.status !== 404) {
        throw new Error('IMMUTABILITY VIOLATION: History endpoints are mutable!');
      }
      console.log('   ✅ Append-only immutability successfully enforced!');

      console.log('\n--- ALL PHASE 7 TIMELINE AND IMMUTABILITY TESTS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ PHASE 7 TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runPhase7Tests();
