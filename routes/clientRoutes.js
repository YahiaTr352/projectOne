const express = require("express");
const { CreateHashCode, getToken, paymentRequest, paymentConfirmation, resendOTP, addUrl, getUrl } = require("../controllers/clientController");
const router = express.Router();

router.post("/get-code" , CreateHashCode);
router.post("/add-url" , addUrl);
router.post("/get-url" , getUrl);
router.post("/get-token" , getToken);
router.post("/payment-request" , paymentRequest);
router.post("/payment-confirmation" , paymentConfirmation);
router.post("/resend-otp" , resendOTP);
module.exports = router;