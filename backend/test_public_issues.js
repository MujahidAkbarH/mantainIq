require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const connectDB = require('./src/config/db');

async function runPublicIssueTests() {
  console.log('--- STARTING PHASE 4 PUBLIC ASSET & ISSUE REPORTING INTEGRATION TEST ---');
  await connectDB();

  const server = app.listen(5004, async () => {
    console.log('[Test Server] Running on http://127.0.0.1:5004');

    try {
      // 1. Authenticate Admin User
      const adminCreds = {
        name: 'Public Module Admin',
        email: `pubadmin_${Date.now()}@maintainiq.com`,
        password: 'password123',
        role: 'Admin',
      };

      console.log('1. Registering Admin user...');
      const regRes = await fetch('http://127.0.0.1:5004/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminCreds),
      });
      const regData = await regRes.json();
      const token = regData.token;

      if (!token) throw new Error('Admin authentication failed');
      console.log('   ✅ Admin Authenticated.');

      // 2. Create Required Test Assets
      console.log('\n2. Registering mandatory test assets...');
      const gateAsset = {
        name: 'Star Kids Grammar Secondary School Main Gate',
        uniqueCode: 'SKG-GATE-01',
        category: 'Safety & Security',
        location: 'Main Campus Entrance',
        condition: 'Good',
        status: 'Operational',
        notes: 'SENSITIVE PRIVATE NOTE: Electronic lock passcode is 4921',
      };

      const ubitAsset = {
        name: 'UBIT Lab Computer',
        uniqueCode: 'UBIT-LAB-01',
        category: 'IT Infrastructure',
        location: 'UBIT Lab 02 - Station 14',
        condition: 'Fair',
        status: 'Operational',
        notes: 'SENSITIVE PRIVATE NOTE: Purchased via Dept Grant #9482',
      };

      await fetch('http://127.0.0.1:5004/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(gateAsset),
      });

      const ubitRes = await fetch('http://127.0.0.1:5004/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(ubitAsset),
      });

      const ubitData = await ubitRes.json();
      console.log('   ✅ Created Asset: Star Kids Grammar Main Gate (SKG-GATE-01)');
      console.log('   ✅ Created Asset: UBIT Lab Computer (UBIT-LAB-01)');

      // 3. Test Public Route Security Stripping
      console.log('\n3. Testing Security Field Stripping (GET /api/public/assets/SKG-GATE-01)...');
      const publicRes = await fetch('http://127.0.0.1:5004/api/public/assets/SKG-GATE-01');
      const publicData = await publicRes.json();
      console.log('   Status Code:', publicRes.status);
      console.log('   Public Response Keys:', Object.keys(publicData.asset));

      if (publicData.asset.notes !== undefined || publicData.asset.technicianId !== undefined) {
        throw new Error('SECURITY VIOLATION: Sensitive fields (notes/technicianId) were not stripped!');
      }
      console.log('   ✅ SECURITY STRIPPING VERIFIED! Private notes & sensitive fields completely excluded.');

      // 4. Test Public Issue Submission & Automatic Asset Status Update
      console.log('\n4. Testing Public Issue Submission (POST /api/public/issues)...');
      const issuePayload = {
        uniqueCode: 'UBIT-LAB-01',
        title: 'Display flickering and HDMI port loose',
        description: 'The monitor display keeps flickering and cuts out during lab sessions.',
        priority: 'High',
        category: 'Audio / Visual Display',
        reporterName: 'Prof. Ahmed',
        reporterContact: 'ahmed@ubit.edu.pk',
      };

      const issueRes = await fetch('http://127.0.0.1:5004/api/public/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issuePayload),
      });

      const issueData = await issueRes.json();
      console.log('   Status Code:', issueRes.status);
      console.log('   Generated Ticket Code:', issueData.issue?.issueNumber);
      console.log('   New Asset Status:', issueData.updatedAssetStatus);

      if (issueRes.status !== 201 || issueData.updatedAssetStatus !== 'Issue Reported') {
        throw new Error('Public issue submission or asset status transition failed!');
      }
      console.log('   ✅ ISSUE CREATED & ASSET STATUS AUTO-UPDATED TO "Issue Reported"!');

      // 5. Verify Asset Status Change on Public Endpoint
      console.log('\n5. Verifying Updated Asset Status via Public API (GET /api/public/assets/UBIT-LAB-01)...');
      const verifyRes = await fetch('http://127.0.0.1:5004/api/public/assets/UBIT-LAB-01');
      const verifyData = await verifyRes.json();
      console.log('   Public Asset Status:', verifyData.asset?.status);

      if (verifyData.asset?.status !== 'Issue Reported') {
        throw new Error('Public asset status state mismatch!');
      }
      console.log('   ✅ PUBLIC ASSET STATUS MATCHES "Issue Reported"!');

      console.log('\n--- ALL PHASE 4 PUBLIC ASSET & ISSUE REPORTING TESTS PASSED PERFECTLY ---');
      server.close();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('❌ PHASE 4 TEST FAILED:', err);
      server.close();
      await mongoose.disconnect();
      process.exit(1);
    }
  });
}

runPublicIssueTests();
