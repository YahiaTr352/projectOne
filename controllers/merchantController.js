const Merchant = require("../models/merchantModel");
const { validateMerchantPhoneNumber, isValidNumber, isValidBoolean } = require("../utils/paymentUtils");
const { encryptBalance, decryptBalance } = require("../utils/encryption");

const addMerchant = async (req, res) => {
    try {
        const { merchantMSISDN, hasMerchantWallet, balance } = req.body;

        if (!merchantMSISDN || !balance || !hasMerchantWallet) {
            return res.status(400).json({ message: "All fields are required" });
          }
      
          if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({ message: "Invalid Merchant Phone Number. It must start with a '+' followed by digits." });
          }
          
          if(!isValidNumber(balance)) return res.status(400).json({message : "Invalid balance"});
      
          if (!isValidBoolean(hasMerchantWallet)) {
            return res.status(400).json({ message: "Invalid value for hasMerchantWallet. Must be true or false." });
          }

        const existingMerchant = await Merchant.findOne({ merchantMSISDN });

        if (existingMerchant) {
            return res.status(400).json({ message: "Merchant with this phone number already exists." });
        }

        const encryptedBalance = encryptBalance(balance);

        const newMerchant = new Merchant({
            merchantMSISDN,
            hasMerchantWallet,
            balance: encryptedBalance
        });

        await newMerchant.save();

        return res.status(200).json({ 
            message: "Merchant created successfully", 
            merchantAccount: newMerchant 
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Something went wrong" });
    }
};

const addMerchantBalance = async (req, res) => {
  try {
    const { merchantMSISDN, balanceToAdd } = req.body;

    if (!merchantMSISDN || balanceToAdd === undefined) {
      return res.status(400).json({ message: "merchantMSISDN and balanceToAdd are required." });
    }

    if (!validateMerchantPhoneNumber(merchantMSISDN)) {
      return res.status(400).json({
        message: "Invalid Merchant Phone Number. It must start with a '+' followed by digits."
      });
    }

    if (!isValidNumber(balanceToAdd)) {
      return res.status(400).json({ message: "Invalid balanceToAdd value." });
    }

    const merchant = await Merchant.findOne({ merchantMSISDN });

    if (!merchant) {
      return res.status(404).json({ message: "Merchant not found." });
    }

    // ✅ Check if merchant has wallet
    if (!merchant.hasMerchantWallet) {
      return res.status(403).json({ message: "Merchant does not have a wallet. Cannot add balance." });
    }

    // Decrypt existing balance and add new balance
    const currentBalance = decryptBalance(merchant.balance);
    console.log(currentBalance);
    const updatedBalance = Number(currentBalance) + Number(balanceToAdd);
    console.log(updatedBalance);
    // Update balance
    merchant.balance = encryptBalance(updatedBalance);
    await merchant.save();

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
    addMerchant,
    addMerchantBalance
};
