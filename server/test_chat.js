const io = require('socket.io-client');

async function testChat() {
    const baseURL = 'http://localhost:3000';
    
    console.log("--- Starting Chat Test ---");

    try {
        // 1. Patient Login & Start Consult
        const patientPhone = `+234${Math.floor(Math.random() * 1000000000)}`;
        // Signup
        await fetch(`${baseURL}/auth/signup`, {
            method: 'POST', body: JSON.stringify({ phone: patientPhone }), headers: {'Content-Type': 'application/json'}
        });
        // Verify
        const pVerifyRes = await fetch(`${baseURL}/auth/verify`, {
            method: 'POST', body: JSON.stringify({ phone: patientPhone, otp: "123456" }), headers: {'Content-Type': 'application/json'}
        });
        const pData = await pVerifyRes.json();
        const pToken = pData.token;
        const pId = pData.user.id;
        console.log(`✅ Patient Logged In (${pData.user.publicId})`);

        // Start Consult
        const startRes = await fetch(`${baseURL}/consultation/start`, {
            method: 'POST', headers: { 'x-auth-token': pToken }
        });
        const consult = await startRes.json();
        const consultId = consult.id;
        console.log(`✅ Consultation Started: ${consultId}`);

        // 2. Doctor Login
        const dVerifyRes = await fetch(`${baseURL}/auth/verify`, {
            method: 'POST', body: JSON.stringify({ phone: "+23480DOCTOR00", otp: "123456" }), headers: {'Content-Type': 'application/json'}
        });
        const dData = await dVerifyRes.json();
        /* const dToken = dData.token; */ // Unused variable
        const dId = dData.user.id;
        console.log(`✅ Doctor Logged In (${dData.user.publicId})`);

        // 3. Socket Connection
        const patientSocket = io(baseURL);
        const doctorSocket = io(baseURL);

        // Promise to wait for messages
        const patientReceived = new Promise(resolve => {
            patientSocket.on('receive_message', (msg) => {
                if (msg.senderId === dId) {
                    console.log(`   📩 Patient received: "${msg.content}"`);
                    resolve();
                }
            });
        });

        const doctorReceived = new Promise(resolve => {
            doctorSocket.on('receive_message', (msg) => {
                if (msg.senderId === pId) {
                    console.log(`   📩 Doctor received: "${msg.content}"`);
                    resolve();
                }
            });
        });

        patientSocket.emit('join_room', consultId);
        doctorSocket.emit('join_room', consultId);

        // 4. Chat Flow
        console.log("   💬 Patient sending message...");
        patientSocket.emit('send_message', {
            consultationId: consultId,
            senderId: pId,
            content: "Hello Doctor, I have a headache."
        });

        await doctorReceived;

        console.log("   💬 Doctor sending reply...");
        doctorSocket.emit('send_message', {
            consultationId: consultId,
            senderId: dId,
            content: "Hello, take two aspirins and call me in the morning."
        });

        await patientReceived;

        console.log("✅ Chat Flow Verified!");
        
        patientSocket.disconnect();
        doctorSocket.disconnect();
        process.exit(0);

    } catch (err) {
        console.error("❌ Test Failed:", err);
        process.exit(1);
    }
}

testChat();
