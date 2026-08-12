require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runPhase6Tests() {
  console.log('--- STARTING PHASE 6 MAINTENANCE & RESOLUTION WORKFLOW TEST ---');
  await connectDB();

  const server = app.listen(5006, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5006');

    try {
      // 1. Create Test Admin
      const adminEmail = `admin_p6_${Date.now()}@maintainiq.com`;
      const adminCreds = {
        name: 'Phase 6 Admin',
        email: adminEmail,
        password: 'password123',
        role: 'Admin',
      };

      console.log('1. Registering Test Admin User...');
      const regAdminRes = await fetch('http://127.0.0.1:5006/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCreds),
      });
      const adminData = await regAdminRes.json();
      const adminToken = adminData.token;
      if (!adminToken) throw new Error('Admin registration/login failed');
      console.log('   ✅ Admin registered and token acquired.');

      // 2. Create Test Technician
      const techEmail = `tech_p6_${Date.now()}@maintainiq.com`;
      const techCreds = {
        name: 'Phase 6 Tech',
        email: techEmail,
        password: 'password123',
        role: 'Technician',
      };

      console.log('2. Registering Test Technician User...');
      const regTechRes = await fetch('http://127.0.0.1:5006/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(techCreds),
      });
      const techData = await regTechRes.json();
      const techToken = techData.token;
      const techId = techData.user.id;
      if (!techToken || !techId) throw new Error('Technician registration failed');
      console.log(`   ✅ Technician registered: ID = ${techId}`);

      // 3. Create or Check Test Asset
      console.log('3. Registering test asset...');
      const assetPayload = {
        name: 'Star Kids Grammar Secondary School Main Gate',
        uniqueCode: `GATE-TEST-${Date.now().toString().slice(-4)}`,
        category: 'Safety & Security',
        location: 'Main Gate Entrance',
        condition: 'Good',
        status: 'Operational',
      };

      const assetRes = await fetch('http://127.0.0.1:5006/api/assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(assetPayload),
      });
      const assetData = await assetRes.json();
      const assetId = assetData.asset?._id;
      const assetCode = assetData.asset?.uniqueCode;
      if (!assetId) throw new Error('Failed to create test asset');
      console.log(`   ✅ Asset created: ${assetCode}`);

      // 4. Submit Public Issue
      console.log('4. Submitting Public Issue...');
      const issuePayload = {
        uniqueCode: assetCode,
        title: 'Broken hinges on gate doors',
        description: 'The gate doors are sagging and the hinges are cracking under load.',
        priority: 'High',
        category: 'Safety & Security',
        reporterName: 'Principal Fatima',
        reporterContact: 'fatima@starkids.edu.pk',
      };

      const issueRes = await fetch('http://127.0.0.1:5006/api/public/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issuePayload),
      });
      const issueData = await issueRes.json();
      const issueId = issueData.issue?.id || issueData.issue?._id;
      if (!issueId) throw new Error('Failed to file public issue');
      console.log(`   ✅ Public issue reported: ${issueData.issue?.issueNumber}`);

      // Verify Asset status is 'Issue Reported'
      const checkAssetRes = await fetch(`http://127.0.0.1:5006/api/public/assets/${assetCode}`);
      const checkAssetData = await checkAssetRes.json();
      console.log(`   Asset status: ${checkAssetData.asset?.status}`);
      if (checkAssetData.asset?.status !== 'Issue Reported') {
        throw new Error("Asset status was not updated to 'Issue Reported'");
      }

      // 5. Admin Assigns Issue to Technician
      console.log(`5. Admin Assigning Issue to Tech (${techId})...`);
      const assignRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ technicianId: techId }),
      });
      const assignData = await assignRes.json();
      console.log(`   Assign response status: ${assignRes.status}`);
      console.log(`   Updated Issue Status: ${assignData.issue?.status}`);
      if (assignData.issue?.status !== 'Assigned') {
        throw new Error("Failed to transition issue status to 'Assigned'");
      }
      console.log('   ✅ Issue successfully assigned.');

      // 6. Technician lists their issues
      console.log('6. Technician listing assigned issues...');
      const techIssuesRes = await fetch('http://127.0.0.1:5006/api/issues', {
        headers: { Authorization: `Bearer ${techToken}` },
      });
      const techIssuesData = await techIssuesRes.json();
      console.log(`   Tech issues count: ${techIssuesData.count}`);
      if (techIssuesData.count === 0) {
        throw new Error('Technician failed to retrieve assigned issues');
      }

      // 7. Progress status to 'Inspection Started'
      console.log("7. Progressing status to 'Inspection Started'...");
      const inspStatusRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techToken}`,
        },
        body: JSON.stringify({ status: 'Inspection Started' }),
      });
      const inspStatusData = await inspStatusRes.json();
      console.log(`   New Issue Status: ${inspStatusData.issue?.status}`);
      console.log(`   Synced Asset Status: ${inspStatusData.assetStatus}`);
      if (inspStatusData.issue?.status !== 'Inspection Started' || inspStatusData.assetStatus !== 'Under Inspection') {
        throw new Error("Failed to transition status to 'Inspection Started' or sync Asset status");
      }
      console.log('   ✅ Inspection status progression verified.');

      // 8. Progress status to 'Maintenance In Progress'
      console.log("8. Progressing status to 'Maintenance In Progress'...");
      const maintStatusRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techToken}`,
        },
        body: JSON.stringify({ status: 'Maintenance In Progress' }),
      });
      const maintStatusData = await maintStatusRes.json();
      console.log(`   New Issue Status: ${maintStatusData.issue?.status}`);
      console.log(`   Synced Asset Status: ${maintStatusData.assetStatus}`);
      if (maintStatusData.issue?.status !== 'Maintenance In Progress' || maintStatusData.assetStatus !== 'Under Maintenance') {
        throw new Error("Failed to transition status to 'Maintenance In Progress' or sync Asset status");
      }
      console.log('   ✅ Maintenance status progression verified.');

      // 9. Test Resolution Validation Constraints
      console.log('9. Testing resolution validation constraints...');
      
      // Cost cannot be negative
      console.log('   - Trying to resolve with negative cost...');
      const negCostRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techToken}`,
        },
        body: JSON.stringify({
          notes: 'Replaced sagging hinges with heavy-duty steel brackets.',
          partsReplaced: 'Steel Brackets, Hinges',
          cost: -45.0,
          finalCondition: 'Good',
        }),
      });
      const negCostData = await negCostRes.json();
      console.log(`     Response status: ${negCostRes.status}, success: ${negCostData.success}`);
      if (negCostRes.status !== 400 || negCostData.success !== false) {
        throw new Error('Rejection of negative cost failed!');
      }
      console.log('     ✅ Negative cost was rejected with 400.');

      // Missing text notes
      console.log('   - Trying to resolve with empty notes...');
      const emptyNotesRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techToken}`,
        },
        body: JSON.stringify({
          notes: '',
          partsReplaced: 'Steel Brackets, Hinges',
          cost: 150.0,
          finalCondition: 'Good',
        }),
      });
      const emptyNotesData = await emptyNotesRes.json();
      console.log(`     Response status: ${emptyNotesRes.status}, success: ${emptyNotesData.success}`);
      if (emptyNotesRes.status !== 400 || emptyNotesData.success !== false) {
        throw new Error('Rejection of empty notes failed!');
      }
      console.log('     ✅ Empty notes were rejected with 400.');

      // 10. Perform valid resolution
      console.log('10. Resolving issue correctly...');
      const validResolveRes = await fetch(`http://127.0.0.1:5006/api/issues/${issueId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${techToken}`,
        },
        body: JSON.stringify({
          notes: 'Replaced sagging hinges with heavy-duty steel brackets. Double-bolted the joints.',
          partsReplaced: 'Heavy Duty Brackets, High Tensile Bolts',
          cost: 125.50,
          finalCondition: 'Good',
        }),
      });
      const validResolveData = await validResolveRes.json();
      console.log(`    Response status: ${validResolveRes.status}`);
      console.log(`    New Issue Status: ${validResolveData.issue?.status}`);
      console.log(`    Synced Asset Status: ${validResolveData.assetStatus}`);
      console.log(`    Maintenance Record Notes: ${validResolveData.maintenanceRecord?.notes}`);
      
      if (validResolveRes.status !== 200 || validResolveData.issue?.status !== 'Resolved' || validResolveData.assetStatus !== 'Operational') {
        throw new Error('Valid issue resolution failed!');
      }
      console.log('    ✅ Valid resolution processed, Asset returned to Operational status.');

      console.log('\n--- ALL PHASE 6 INTEGRATION & WORKFLOW VALIDATIONS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ PHASE 6 TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runPhase6Tests();
