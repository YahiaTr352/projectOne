const Merchant = require("../models/merchantModel");
const { validateMerchantPhoneNumber, isValidNumber, isValidBoolean } = require("../utils/paymentUtils");
const { encryptBalance } = require("../utils/encryption");

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

module.exports = addMerchant;
