const Customer = require("../models/customerModel");
const { validateCustomerPhoneNumber, isValidBoolean, isValidNumber } = require("../utils/paymentUtils");
const { encryptBalance, decryptBalance } = require("../utils/encryption");

const addCustomer = async (req, res) => {
  try {
    const { customerMSISDN, hasCustomerWallet, balance } = req.body;

    if (!customerMSISDN || !balance || !hasCustomerWallet) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!validateCustomerPhoneNumber(customerMSISDN)) {
      return res.status(400).json({ 
        message: "Invalid phone number. It must be a Syrian number starting with 09 or 9." 
      });
    }
    
    if(!isValidNumber(balance)) return res.status(400).json({message : "Invalid balance"});

    if (!isValidBoolean(hasCustomerWallet)) {
      return res.status(400).json({ message: "Invalid value for hasCustomerWallet. Must be true or false." });
    }




    const existingCustomer = await Customer.findOne({ customerMSISDN });

    if (existingCustomer) {
      return res.status(400).json({ message: "Customer with this phone number already exists." });
    }

    const encryptedBalance = encryptBalance(balance);
    const newCustomer = new Customer({
      customerMSISDN,
      hasCustomerWallet,
      balance: encryptedBalance,
    });

    await newCustomer.save();

    return res.status(200).json({ 
      message: "Customer created successfully", 
      customerAccount: newCustomer 
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

const addCustomerBalance = async (req, res) => {
  try {
    const { customerMSISDN, balanceToAdd } = req.body;

    if (!customerMSISDN || balanceToAdd === undefined) {
      return res.status(400).json({ message: "customerMSISDN and balanceToAdd are required." });
    }

    if (!validateCustomerPhoneNumber(customerMSISDN)) {
      return res.status(400).json({
        message: "Invalid phone number. It must be a Syrian number starting with 09 or 9."
      });
    }

    if (!isValidNumber(balanceToAdd)) {
      return res.status(400).json({ message: "Invalid balanceToAdd value." });
    }

    const customer = await Customer.findOne({ customerMSISDN });

    if (!customer) {
      return res.status(404).json({ message: "Customer not found." });
    }

    // ✅ Check if customer has wallet
    if (!customer.hasCustomerWallet) {
      return res.status(403).json({ message: "Customer does not have a wallet. Cannot add balance." });
    }

    // Decrypt existing balance and add new balance
    const currentBalance = decryptBalance(customer.balance);
    const updatedBalance = Number(currentBalance) + Number(balanceToAdd);
    // Update balance
    customer.balance = encryptBalance(updatedBalance);
    await customer.save();

    return res.status(200).json({
      message: "Balance added successfully.",
      updatedBalance: updatedBalance
    });

  } catch (error) {
    console.error("Error adding balance:", error);
    return res.status(500).json({ message: "Server error while adding balance." });
  }
};


module.exports = {
  addCustomer,
  addCustomerBalance
};
