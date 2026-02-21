
async function testProfile() {
  const baseURL = 'http://localhost:3000';
  const phone = `+234${Math.floor(Math.random() * 1000000000)}`;

  console.log(`1. Designing Ghost Identity for ${phone}...`);
  try {
    // 1. Signup & Verification
    const regRes = await fetch(`${baseURL}/auth/signup`, {
        method: 'POST', body: JSON.stringify({ phone }), headers: {'Content-Type': 'application/json'}
    });
    const regData = await regRes.json();
    const otp = regData.debugOtp;
    
    const verifyRes = await fetch(`${baseURL}/auth/verify`, {
        method: 'POST', body: JSON.stringify({ phone, otp }), headers: {'Content-Type': 'application/json'}
    });
    const verifyData = await verifyRes.json();
    const token = verifyData.token;
    console.log("   ✅ Auth Token Received");

    // 2. Get Profile (Initial)
    console.log("2. Fetching Initial Profile...");
    const profileRes = await fetch(`${baseURL}/user/profile`, {
        headers: { 'x-auth-token': token }
    });
    const profileData = await profileRes.json();
    console.log("   ✅ Initial Profile:", profileData);

    // 3. Update Profile
    console.log("3. Updating Profile (Setting Avatar/Nickname)...");
    const updateRes = await fetch(`${baseURL}/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token },
        body: JSON.stringify({
            nickname: "GhostRider",
            avatar: "avatar_1.png",
            age: 25,
            sex: "Male"
        })
    });
    const updateData = await updateRes.json();
    console.log("   ✅ Update Response:", updateData);
    
    // 4. Verify Update
    const checkRes = await fetch(`${baseURL}/user/profile`, { headers: { 'x-auth-token': token } });
    const checkData = await checkRes.json();
    
    if (checkData.nickname === "GhostRider") {
        console.log("   ✅ Profile Update Verified!");
    } else {
        console.error("   ❌ Profile Update Failed:", checkData);
    }

  } catch (error) {
    console.error("   ❌ Test Failed:", error.message);
  }
}

testProfile();
