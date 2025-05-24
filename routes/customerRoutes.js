const express = require("express");
const { addCustomer, addCustomerBalance } = require("../controllers/customerController");
const router = express.Router();

router.post("/add-customer" , addCustomer);
router.post("/add-balance" , addCustomerBalance);

module.exports = router;