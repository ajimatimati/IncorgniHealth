const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testAnonymity() {
    console.log("🕵️ Starting Double-Blind Anonymity Check...");
    let issues = 0;

    try {
        // 1. Check Pharmacy Feed
        console.log("\n[1] Checking Pharmacy Feed (Public Endpoint)...");
        const pharmacyRes = await axios.get(`${BASE_URL}/pharmacy/feed`);
        const orders = pharmacyRes.data;
        
        if (Array.isArray(orders) && orders.length > 0) {
            orders.forEach(o => {
                if (o.patientName || o.patient?.name || o.phone) {
                    console.error(`❌ FAILURE: PII found in Pharmacy Order ${o.id}`);
                    issues++;
                } else {
                    console.log(`✅ Order ${o.publicOrderId} is blind (No Name/Phone).`);
                }
            });
        } else {
            console.warn("⚠️ No orders to test in Pharmacy Feed.");
        }

        // 2. Check Rider Feed (if implemented publicly or via mock auth)
        // ... (Rider endpoint might need auth, skipping for simple script unless we mock token)
        
        // 3. Verify Patient Object Structure in Database (Mock check via API if possible, or just strict typing)
        // We rely on route code review for this mostly.

    } catch (err) {
        console.error("❌ Network Error or Server Down:", err.message);
        issues++;
    }

    if (issues === 0) {
        console.log("\n🎉 SUCCESS: No PII leakage detected in tested public endpoints.");
    } else {
        console.log(`\n⚠️ NON-COMPLIANT: Found ${issues} potential privacy leaks.`);
    }
}

testAnonymity();
