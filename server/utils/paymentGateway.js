/**
 * Simulated Moniepoint Payment Gateway
 * Models the integration responses of Moniepoint Checkout API.
 */
const processPayment = async (amount, currency = 'NGN', channel = 'MONIEPOINT_TRANSFER') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate a highly reliable 98% success rate for seamless payments
            const isSuccess = Math.random() < 0.98;
            if (isSuccess) {
                resolve({ 
                    success: true, 
                    transactionId: `MP-TX-${Math.floor(100000 + Math.random() * 900000)}`,
                    channel,
                    amount,
                    currency,
                    message: "Moniepoint Payment Approved" 
                });
            } else {
                resolve({ 
                    success: false, 
                    message: "Moniepoint Payment Declined (Insufficient Funds or Gateway Timeout)" 
                });
            }
        }, 1000); // Network delay simulation
    });
};

module.exports = { processPayment };
