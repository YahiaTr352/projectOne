const express = require("express");
const { CreateHashCode, getToken, paymentRequest, paymentConfirmation, resendOTP, addUrl, getUrl, saveServer,getAllCodesAndPrograms,getAllUrlsAndPrograms,deleteCodeById,updateUrlById,getCodeByMerchantNumber  } = require("../controllers/clientController");
const router = express.Router();

router.post("/save-server" , saveServer);
router.post("/get-code" , CreateHashCode);
router.post("/add-url" , addUrl);
router.post("/get-url" , getUrl);
router.post("/get-token" , getToken);
router.post("/payment-request" , paymentRequest);
router.post("/payment-confirmation" , paymentConfirmation);
router.post("/resend-otp" , resendOTP);

router.get("/getAllCodesAndProgramms" , getAllCodesAndPrograms);
router.delete("/deleteCodeById/:id" , deleteCodeById);
router.get("/getAllUrlsAndProgramms" , getAllUrlsAndPrograms);
router.put('/updateUrlOfProgram/:id', updateUrlById);
router.get('/getCodeByMerchantNumber', getCodeByMerchantNumber);
router.get('/clients/by-merchant-number', getAllUrlsAndPrograms);
module.exports = router;