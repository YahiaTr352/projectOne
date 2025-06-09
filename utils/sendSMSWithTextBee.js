const axios = require('axios');

async function sendSMSWithTextBee(phoneNumber, message) {
    const API_KEY = process.env.API_KEY;
    const DEVICE_ID = process.env.DEVICE_ID;       

    try {
        const response = await axios.post(
            `https://api.textbee.dev/api/v1/gateway/devices/${DEVICE_ID}/send-sms`,
            {
                recipients: [phoneNumber],
                message: message,
            },
            {
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                },
            }
        );

        console.log("✅ SMS Sent:", response.data);
        return response.data;
    } catch (err) {
        console.error("❌ SMS Error:", err.response?.data || err.message);
        throw err;
    }
}

module.exports = sendSMSWithTextBee;
