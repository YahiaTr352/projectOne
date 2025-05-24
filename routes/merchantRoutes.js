const express = require("express");
const { addMerchant, addMerchantBalance } = require("../controllers/merchantController");
const router = express.Router();

router.post("/add-merchant" , addMerchant);
router.post("/add-balance" , addMerchantBalance);

module.exports = router;