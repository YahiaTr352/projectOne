const express = require("express");
const addCustomer = require("../controllers/customerController");
const router = express.Router();

router.post("/add-customer" , addCustomer);

module.exports = router;