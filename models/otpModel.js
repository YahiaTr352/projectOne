const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
    customerMSISDN: { type: String, required: true },
    otp: { type: String, required: true },
    tries: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 600 }
});

const Otp = mongoose.model("Otp" , otpSchema);

module.exports = Otp;