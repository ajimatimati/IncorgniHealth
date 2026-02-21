
async function testDoctor() {
  const baseURL = 'http://localhost:3000';
  const doctorPhone = "+23480DOCTOR00";

  console.log("1. Doctor Login...");
  try {
    // 1. Verify/Login
    // Note: Seed creates entry, but we need to generate token via verify
    // OTP is mock "123456"
    const verifyRes = await fetch(`${baseURL}/auth/verify`, {
        method: 'POST', body: JSON.stringify({ phone: doctorPhone, otp: "123456" }), headers: {'Content-Type': 'application/json'}
    });
    
    if (!verifyRes.ok) throw new Error("Doctor Login Failed");

    const verifyData = await verifyRes.json();
    const token = verifyData.token;
    console.log("   ✅ Doctor Token Received. Role:", verifyData.user.role);

    if (verifyData.user.role !== 'DOCTOR') {
        throw new Error("User is not a DOCTOR");
    }

    // 2. Fetch Queue
    console.log("2. Fetching Patient Queue...");
    const queueRes = await fetch(`${baseURL}/doctor/queue`, {
        headers: { 'x-auth-token': token }
    });
    const queueData = await queueRes.json();
    console.log("   ✅ Queue Fetched. Count:", queueData.length);
    
    if (queueData.length > 0) {
        console.log("   Example Patient:", queueData[0].patient.publicId);
    }

  } catch (error) {
    console.error("   ❌ Test Failed:", error.message);
  }
}

testDoctor();
