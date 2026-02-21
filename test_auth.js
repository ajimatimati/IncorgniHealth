
async function testAuth() {
  const baseURL = 'http://localhost:3000';
  const phone = `+234${Math.floor(Math.random() * 1000000000)}`; // Random phone to avoid duplicate error

  console.log(`1. Testing Registration for ${phone}...`);
  try {
    const regRes = await fetch(`${baseURL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    });
    
    if (!regRes.ok) {
        throw new Error(`Registration failed: ${regRes.status} ${await regRes.text()}`);
    }

    const regData = await regRes.json();
    console.log("   ✅ Registration Success:", regData);

    const otp = regData.debugOtp; 

    console.log(`2. Testing Verification with OTP: ${otp}...`);
    const verifyRes = await fetch(`${baseURL}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
    });

    if (!verifyRes.ok) {
        throw new Error(`Verification failed: ${verifyRes.status} ${await verifyRes.text()}`);
    }

    const verifyData = await verifyRes.json();
    console.log("   ✅ Verification Success:", verifyData);
    
    if (verifyData.user.publicId.startsWith("#GH-")) {
        console.log("   ✅ Ghost ID Format Correct:", verifyData.user.publicId);
    } else {
        console.error("   ❌ Ghost ID Format Incorrect:", verifyData.user.publicId);
    }

  } catch (error) {
    console.error("   ❌ Test Failed:", error.message);
  }
}

testAuth();
