const express = require("express");
const addMerchant = require("../controllers/merchantController");
const router = express.Router();

router.post("/add-merchant" , addMerchant);

module.exports = router;