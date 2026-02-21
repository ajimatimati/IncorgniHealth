/**
 * Mock Payment Gateway
 * Simulates a payment provider like Paystack or Flutterwave.
 */
const processPayment = async (amount, currency = 'NGN') => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // Simulate 90% success rate
            const isSuccess = Math.random() < 0.9;
            if (isSuccess) {
                resolve({ 
                    success: true, 
                    transactionId: `TX-${Math.floor(Math.random() * 1000000)}`,
                    message: "Payment Successful" 
                });
            } else {
                resolve({ 
                    success: false, 
                    message: "Payment Declined (Insufficient Funds or Network Error)" 
                });
            }
        }, 1500); // Simulate network delay
    });
};

module.exports = { processPayment };
