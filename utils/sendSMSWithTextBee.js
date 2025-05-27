const axios = require('axios');

async function sendSMSWithTextBee(phoneNumber, message) {
    const API_KEY = "f87e4a69-43e1-4194-9689-4d05e79d5509"; // استبدلها بـ API Key تبعك
    const DEVICE_ID = "6835c3649f3070afa27261ac";           // من التطبيق

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
