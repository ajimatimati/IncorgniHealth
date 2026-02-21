
async function testTelemedicine() {
    const baseURL = 'http://localhost:3000';
    console.log("--- Starting Telemedicine Test ---");

    try {
        // 1. Doctor Login
        const dVerifyRes = await fetch(`${baseURL}/auth/verify`, {
            method: 'POST', body: JSON.stringify({ phone: "+23480DOCTOR00", otp: "123456" }), headers: {'Content-Type': 'application/json'}
        });
        const dData = await dVerifyRes.json();
        const dToken = dData.token;
        console.log(`✅ Doctor Logged In`);

        // 2. Test AI Analyze
        console.log("   🤖 Testing AI Symptom Analysis...");
        const aiRes = await fetch(`${baseURL}/ai/analyze`, {
            method: 'POST',
            body: JSON.stringify({ symptoms: "I have a severe headache and high fever" }),
            headers: { 'Content-Type': 'application/json', 'x-auth-token': dToken }
        });
        const aiData = await aiRes.json();
        console.log(`      Diagnosis: ${aiData.diagnosis} (Confidence: ${aiData.confidence})`);
        
        if (aiData.diagnosis.includes("Malaria")) {
            console.log("   ✅ AI Logic Verified");
        } else {
            console.error("   ❌ AI Logic Failed or returned unexpected result");
        }

        // 3. Test Prescription
        // We need a consultation ID. Let's create one or pick one.
        // For simplicity, we'll start one as the doctor (acting as patient? No, doctor can't start consult on themselves usually)
        // Let's just pick the first consultation from queue or create a dummy one if we can.
        // Actually, we can just use a random UUID if the DB doesn't enforce FK (it usually does).
        // Let's create a patient first to start a consult.
        
        const pPhone = `+234${Math.floor(Math.random() * 1000000000)}`;
        // Signup Patient
        await fetch(`${baseURL}/auth/signup`, { method: 'POST', body: JSON.stringify({ phone: pPhone }), headers: {'Content-Type': 'application/json'} });
        const pVerify = await fetch(`${baseURL}/auth/verify`, { method: 'POST', body: JSON.stringify({ phone: pPhone, otp: "123456" }), headers: {'Content-Type': 'application/json'} });
        const pToken = (await pVerify.json()).token;
        
        // Start Consult
        const cRes = await fetch(`${baseURL}/consultation/start`, { method: 'POST', headers: { 'x-auth-token': pToken } });
        const consult = await cRes.json();
        
        console.log(`   💊 Issuing Prescription for Consult ${consult.id}...`);
        
        const rxRes = await fetch(`${baseURL}/ai/prescribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-auth-token': dToken },
            body: JSON.stringify({
                consultationId: consult.id,
                medication: "Amoxicillin",
                dosage: "500mg",
                instructions: "Twice daily for 7 days"
            })
        });
        const rxData = await rxRes.json();
        
        if (rxData.id && rxData.status === 'PENDING') {
            console.log(`   ✅ Prescription Issued: ${rxData.medication}`);
        } else {
            console.error("   ❌ Prescription Failed", rxData);
        }

    } catch (err) {
        console.error("❌ Test Failed:", err);
    }
}

testTelemedicine();
