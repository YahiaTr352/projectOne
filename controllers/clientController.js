const Client = require("../models/clientModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Merchant = require("../models/merchantModel");
const paymentTransaction = require("../models/paymentTransaction");
const Otp = require("../models/otpModel");
const PaymentTransaction = require("../models/paymentTransaction");
const Customer = require("../models/customerModel");
const {isValidAmount, calculateFees, generateNumericCode, findMerchantAndClient, validateCustomerPhoneNumber, validateMerchantPhoneNumber, isValidString, isValidOTP, isValidNumber } = require("../utils/paymentUtils");
const { encryptBalance, decryptBalance } = require('../utils/encryption');
const { verifyToken } = require("../utils/paymentUtils");
const sendSMSWithTextBee = require("../utils/sendSMSWithTextBee");


const saveServer = (req,res) => {
    try{
        return res.status(200).json({message : "server is running"});

    }catch(error){
        return res.status(400).json({message : "something went wrong" , error})
    }
}

const CreateHashCode = async (req, res) => {
    try {
        const { companyName, programmName, merchantMSISDN } = req.body;

        if (!companyName || !programmName || !merchantMSISDN) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (!isValidString(companyName)) {
            return res.status(400).json({ message: "Invalid Company Name" });
        }

        if (!isValidString(programmName)) {
            return res.status(400).json({ message: "Invalid Program Name" });
        }

        if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({
                message: "Invalid Merchant Phone Number. It must start with a '+' followed by digits."
            });
        }

        const merchant = await Merchant.findOne({ merchantMSISDN });
        if (!merchant) {
            return res.status(404).json({ message: "Merchant not found" });
        }

        const existingClient = await Client.findOne({
            companyName,
            programmName,
            merchantMSISDN: merchant._id
        });

        if (existingClient) {
            return res.status(400).json({
                message: "This program already exists for this company and merchant."
            });
        }

        const code = generateNumericCode(12);
        const salt = await bcrypt.genSalt(10);
        const hashedCode = await bcrypt.hash(code, salt);

        const newClient = new Client({
            companyName,
            programmName,
            merchantMSISDN: merchant._id,
            code: hashedCode
        });

        await newClient.save();

        return res.status(200).json({ code });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
};


const addUrl = async (req, res) => {
  try {
    const { companyName, programmName, code, url } = req.body;

    if(!companyName || !programmName || !code || !url) return res.status(400).json({message : "All fields are required"});

    const existingClient = await Client.findOne({ companyName, programmName});

    if (!existingClient) {
      return res.status(404).json({ message: "Client with the specified companyName or programmName  not found." });
    }


    const isCodeValid = await bcrypt.compare(code, existingClient.code);
        if (!isCodeValid) {
      return res.status(404).json({ message: "Invalid Code" });
    }

    existingClient.url = url;

    await existingClient.save();

    res.status(200).json({ message: "URL added successfully", data: existingClient });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
};


const getUrl = async (req, res) => {
  try {
    const { companyName, programmName, code } = req.body;

    if (!companyName || !programmName || !code) {
      return res.status(400).json({ message: "Missing required parameters." });
    }

    const existingClient = await Client.findOne({ companyName, programmName});

    if (!existingClient) {
      return res.status(404).json({ message: "Client with the specified companyName or programmName  not found." });
    }


    const isCodeValid = await bcrypt.compare(code, existingClient.code);
        if (!isCodeValid) {
      return res.status(404).json({ message: "Invalid Code" });
    }

    if (existingClient.url) {
      return res.status(200).json({ url: existingClient.url });
    } else {
      return res.status(404).json({ message: "URL not found for this client." });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong. Please try again later." });
  }
}

const getToken = async (req, res) => {
    try {
        const { companyName, programmName, merchantMSISDN, code } = req.body;

        if (!companyName || !programmName || !code || !merchantMSISDN) return res.status(400).json({message : "All fields are required"});

        if(!isValidString(companyName)) return res.status(400).json({message : "Invalid CompanyName"});
        if(!isValidString(programmName)) return res.status(400).json({message : "Invalid ProgrammName"});
        if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({ message: "Invalid Merchant Phone Number. It must start with a '+' followed by digits." });
        }
        if(!isValidNumber(code)) return res.status(400).json({message : "Invalid Code"});


        const merchant = await Merchant.findOne({ merchantMSISDN });
        if (!merchant) {
            return res.status(404).json({
                errorCode: -100,
                errorDesc: "Merchant not found"
            });
        }

        const client = await Client.findOne({ 
            companyName, 
            programmName, 
            merchantMSISDN: merchant._id 
        });

        if (!client) {
            return res.status(404).json({
                errorCode: -101,
                errorDesc: "Company or Program not found or Merchant not matching"
            });
        }

        const isMatch = await bcrypt.compare(code, client.code);

        if (!isMatch) {
            return res.status(401).json({
                errorCode: -102,
                errorDesc: "Invalid code"
            });
        }

        const token = jwt.sign(
            { companyId: client._id },
             process.env.TOKEN_SECRET_KEY,
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            errorCode: 0,
            errorDesc: "Success",
            token
        });

    } catch (error) {
        return res.status(500).json({ 
            errorCode: -500,
            errorDesc: "Technical Error",
            message: error.message 
        });
    }
};


const paymentRequest = async (req, res) => {
    try {
        const { code, customerMSISDN, transactionID, merchantMSISDN, amount, token } = req.body;

        if (!customerMSISDN || !merchantMSISDN || !amount || !transactionID || !token) {
            return res.status(400).json({
                errorCode: -99,
                errorDesc: "one or more parameters are null"
            });
        }

        if(!isValidNumber(code)) return res.status(400).json({message : "Invalid Code"});

        if(!validateCustomerPhoneNumber(customerMSISDN)) return res.status(400).json({message : "Invalid phone number. It must be a Syrian number starting with 09."});

        if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({ message: "Invalid merchant phone number. It must start with a '+' followed by digits." });
        }

        if (!isValidAmount(amount)) {
            return res.status(400).json({
                errorCode: -3,
                errorDesc: "Invalid amount (the amount is negative or it contains comma, symbols or characters)"
            });
        }

        if(!isValidString(transactionID)) return res.status(400).json({message : "Invalid transactionID"});

        const { valid } = verifyToken(token);
        if (!valid) {
            return res.status(400).json({
                errorCode: -500,
                errorDesc: "The token is invalid"
            });
        }

        const { merchant, matchedClient } = await findMerchantAndClient(merchantMSISDN, code);

        if (!matchedClient || !merchant) {
            return res.status(400).json({
                errorCode: -102,
                errorDesc: "The caller IP or merchant MSISDN is not defined"
            });
        }

        if (!merchant.active) {
            return res.status(400).json({
                errorCode: -7,
                errorDesc: "Merchant MSISDN is not active"
            });
        }

        if (!merchant.hasMerchantWallet) {
            return res.status(400).json({
                errorCode: -10,
                errorDesc: "Merchant MSISDN doesn't have merchant wallet"
            });
        }

        const existingTransaction = await PaymentTransaction.findOne({ transactionID })
            .populate('customerMSISDN', 'customerMSISDN')
            .populate('merchantMSISDN', 'merchantMSISDN');

            if (existingTransaction) {
                const now = new Date();
                const elapsedMinutes = (now - new Date(existingTransaction.createdAt)) / 1000 / 60;
                if (elapsedMinutes >= 10) {
                    return res.status(400).json({
                        errorCode: -98,
                        errorDesc: "Expired transaction (10 minutes have been passed)"
                    });
                }
            
                if (
                    existingTransaction.customerMSISDN.customerMSISDN !== customerMSISDN ||
                    existingTransaction.merchantMSISDN.merchantMSISDN !== merchantMSISDN ||
                    existingTransaction.amount !== Number(amount)
                ) {
                    return res.status(409).json({
                        errorCode: -101,
                        errorDesc: 'Duplicated transaction ID with different parameters'
                    });
                }
            }

        const OTP = generateNumericCode(6);
        
        const fees = calculateFees(amount);

        await Otp.findOneAndUpdate(
            { customerMSISDN },
            { otp: OTP, createdAt: new Date(), tries: 0 },
            { upsert: true, new: true }
        );

        let customerId = null;
        const customer = await Customer.findOne({ customerMSISDN });

        if (!customer) {
            return res.status(404).json({ message: "customerMSISDN not found" });
        } else {
            customerId = customer._id;
        }

        let newPaymentTransaction = existingTransaction;

        if (!existingTransaction) {
            newPaymentTransaction = new PaymentTransaction({
                companyName: matchedClient.companyName,
                programmName: matchedClient.programmName,
                merchantMSISDN: merchant._id,
                customerMSISDN: customerId,
                amount,
                fees,
                transactionID,
            });

            await newPaymentTransaction.save();
        }

        const programmName = newPaymentTransaction?.programmName;
        await sendSMSWithTextBee(
            customerMSISDN,
            `To complete your payment, please use the code below:
            Customer: ${customerMSISDN}
            Amount: ${amount} SYP
            Fees: ${fees} SYP
            Program: ${programmName}
            Code: ${OTP}
            
            Thank you for choosing our service.`
        );
        

        return res.status(200).json({
            errorCode: 0,
            errorDesc: "Success",
        });

    } catch (error) {
        console.error("Payment Error:", error);
        return res.status(500).json({
            errorCode: -100,
            errorDesc: "Technical error"
        });
    }
};



const paymentConfirmation = async (req, res) => {
    try {
        const { code, OTP, merchantMSISDN, transactionID, token } = req.body;

        if (!code || !OTP || !merchantMSISDN || !transactionID || !token) {
            return res.status(400).json({
                errorCode: -99,
                errorDesc: "One or more parameters are null"
            });
        }

        if(!isValidNumber(code)) return res.status(400).json({message : "Invalid Code"});

        if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({ 
                message: "Invalid merchant phone number. It must start with a '+' followed by digits." 
            });
        }

        if(!isValidOTP(OTP)) return res.status(400).json({message : "Invalid OTP"});

        if(!isValidString(transactionID)) return res.status(400).json({message : "Invalid transactionID"});

        const { valid } = verifyToken(token);
        if (!valid) {
            return res.status(400).json({
                errorCode: -500,
                errorDesc: "The token is invalid"
            });
        }

        const existingTransaction = await PaymentTransaction.findOne({ transactionID })
            .populate('customerMSISDN')
            .populate('merchantMSISDN', 'merchantMSISDN');

            if (existingTransaction.success) {
                return res.status(409).json({
                    errorCode: -97,
                    errorDesc: "This transaction has already been confirmed"
                });
            }

        const { merchant, matchedClient } = await findMerchantAndClient(merchantMSISDN, code);

        if (!matchedClient || !merchant) {
            return res.status(400).json({
                errorCode: -102,
                errorDesc: "The caller IP or merchant MSISDN is not defined"
            });
        }


        if (
            existingTransaction.merchantMSISDN.merchantMSISDN !== merchantMSISDN 
        ) {
            return res.status(409).json({
                errorCode: -101,
                errorDesc: 'Duplicated transaction ID with different parameters'
            });
        }

        const now = new Date();
        const elapsedMs = now - new Date(existingTransaction.createdAt);
        const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

        if (elapsedDays >= 1) {
            return res.status(411).json({
                errorCode: -98,
                errorDesc: "Expired transaction (1 day has been passed)"
            });
        }

        const otpRecord = await Otp.findOne({ customerMSISDN: existingTransaction.customerMSISDN.customerMSISDN });

        if (!otpRecord) {
            return res.status(404).json({
                errorCode: -104,
                errorDesc: "Expired OTP"
            });
        }

        if (!otpRecord.tries) otpRecord.tries = 0;

        if (otpRecord.otp !== OTP) {
            otpRecord.tries += 1;
            await otpRecord.save();

            if (otpRecord.tries >= 3) {
                await Otp.deleteOne({ _id: otpRecord._id });
                return res.status(405).json({
                    errorCode: -95,
                    errorDesc: "Exceed OTP tries"
                });
            }

            return res.status(406).json({
                errorCode: -96,
                errorDesc: "Invalid OTP"
            });
        }

        const customer = existingTransaction.customerMSISDN;

        if (!customer.active) {
            return res.status(407).json({
                errorCode: -6,
                errorDesc: "Customer MSISDN is not active"
            });
        }

        if (!customer.hasCustomerWallet) {
            return res.status(408).json({
                errorCode: -8,
                errorDesc: "Customer does not have customer wallet"
            });
        }

        let customerBalance = decryptBalance(customer.balance);
        let merchantBalance = decryptBalance(merchant.balance);

        const totalAmount = existingTransaction.amount + existingTransaction.fees;

        if (customerBalance < totalAmount) {
            return res.status(410).json({
                errorCode: -13,
                errorDesc: "Customer MSISDN doesn’t have enough balance"
            });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const dailySpent = await PaymentTransaction.aggregate([
            {
                $match: {
                    customerMSISDN: customer._id,
                    createdAt: { $gte: today }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSpent: { $sum: { $add: ["$amount", "$fees"] } }
                }
            }
        ]);

        const spentToday = dailySpent[0]?.totalSpent || 0;
        if ((spentToday + totalAmount) > 550000) {
            return res.status(412).json({
                errorCode: -17,
                errorDesc: "Customer MSISDN will exceed the expenditure limit per day which is 550,000 SYP"
            });
        }

        try {
            customerBalance -= totalAmount;
            merchantBalance += existingTransaction.amount;

            customer.balance = encryptBalance(customerBalance);
            merchant.balance = encryptBalance(merchantBalance);

            await customer.save();
            await merchant.save();
        } catch (error) {
            console.error("Error updating balances:", error);
            return res.status(500).json({
                errorCode: -103,
                errorDesc: "Technical error in adding amount to merchant account. Customer deserves a refund from Syriatel side."
            });
        }

        await Otp.deleteOne({ _id: otpRecord._id });

        existingTransaction.success = true;
        await existingTransaction.save();

        const populatedTransaction = await PaymentTransaction.findById(existingTransaction._id)
            .populate('customerMSISDN', 'customerMSISDN')
            .populate('merchantMSISDN', 'merchantMSISDN');

            await sendSMSWithTextBee(
            populatedTransaction.customerMSISDN.customerMSISDN,
            `Your payment was completed successfully.
            Customer: ${populatedTransaction.customerMSISDN.customerMSISDN}
            Merchant: ${populatedTransaction.merchantMSISDN.merchantMSISDN}
            Amount: ${populatedTransaction.amount} SYP
            Fees: ${populatedTransaction.fees} SYP
            Program: ${populatedTransaction.programmName}
            Thank you for choosing our service.`
            );

            await sendSMSWithTextBee(
            populatedTransaction.merchantMSISDN.merchantMSISDN,
            `Payment received successfully.
            customer: ${populatedTransaction.customerMSISDN.customerMSISDN}
            merchant: ${populatedTransaction.merchantMSISDN.merchantMSISDN}
            Amount: ${populatedTransaction.amount} SYP
            company : ${populatedTransaction.companyName}
            Program: ${populatedTransaction.programmName}
            Thank you for using our platform.`
            );



        return res.status(200).json({
            errorCode: 0,
            errorDesc: "Success",
        });

    } catch (error) {
        console.error("Confirmation Error:", error);
        return res.status(500).json({
            errorCode: -100,
            errorDesc: "Technical error"
        });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { code , merchantMSISDN, transactionID, token } = req.body;

        if (!code || !merchantMSISDN || !transactionID || !token) {
            return res.status(400).json({
                errorCode: -99,
                errorDesc: "One or more parameters are null"
            });
        }

        if(!isValidNumber(code)) return res.status(400).json({message : "Invalid Code"});

        if (!validateMerchantPhoneNumber(merchantMSISDN)) {
            return res.status(400).json({ message: "Invalid merchant phone number. It must start with a '+' followed by digits." });
        }

        if(!isValidString(transactionID)) return res.status(400).json({message : "Invalid transactionID"});

        const { valid } = verifyToken(token);
        if (!valid) {
            return res.status(400).json({
                errorCode: -500,
                errorDesc: "The token is invalid"
            });
        }

        const transaction = await PaymentTransaction.findOne({ transactionID })
            .populate('merchantMSISDN')
            .populate('customerMSISDN');

        if (!transaction) {
            return res.status(404).json({
                errorCode: -97,
                errorDesc: "Invalid or expired transaction"
            });
        }

        if (transaction.success) {
            return res.status(405).json({
                errorCode: -90,
                errorDesc: "Cannot resend OTP for a confirmed transaction"
            });
        }

        const clients = await Client.find();

        const { merchant, matchedClient } = await findMerchantAndClient(merchantMSISDN, code);

        if (!matchedClient || !merchant) {
            return res.status(400).json({
                errorCode: -102,
                errorDesc: "The caller IP or merchant MSISDN is not defined"
            });
        }

        const now = new Date();
        const elapsedMinutes = (now - transaction.createdAt) / 1000 / 60;

        if (elapsedMinutes >= 10) {
            return res.status(410).json({
                errorCode: -98,
                errorDesc: "Expired transaction (10 minutes have been passed)"
            });
        }

        const newOtp = generateNumericCode(6);
        // const newOtp = "000000";

        await Otp.findOneAndUpdate(
            { customerMSISDN: transaction.customerMSISDN.customerMSISDN },
            {
                $set: {
                    otp: newOtp,
                    createdAt: new Date(),
                    tries: 0
                }
            },
            { upsert: true, new: true }
        );        

        await sendSMSWithTextBee(transaction.customerMSISDN.customerMSISDN,`new code is: ${newOtp}`);

        return res.status(200).json({
            errorCode: 0,
            errorDesc: "Success"
        });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return res.status(500).json({
            errorCode: -100,
            errorDesc: "Technical error"
        });
    }
};
const getAllCodesAndPrograms = async (req, res) => {
  try {
    const clients = await Client.find({}, '-url') // exclude the `url` field from Client
      .populate({
        path: 'merchantMSISDN',
        select: 'merchantMSISDN -_id' // include only the merchantMSISDN string
      });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error });
  }
};

const getAllUrlsAndPrograms = async (req, res) => {
  try {
    const clients = await Client.find({}, '-code') // exclude the `url` field from Client
      .populate({
        path: 'merchantMSISDN',
        select: 'merchantMSISDN -_id' // include only the merchantMSISDN string
      });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching', error });
  }
};
const deleteCodeById= async (req, res) => {
  try {
    const { id } = req.params;

    const deletedClient = await Client.findByIdAndDelete(id);

    if (!deletedClient) {
      return res.status(404).json({ message: 'code not found' });
    }

    res.status(200).json({ message: 'code deleted successfully', deletedClient });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting code', error });
  }
};
const updateUrlById = async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { url },
      { new: true } // return the updated document
    );

    if (!updatedClient) {
      return res.status(404).json({ message: 'program not found' });
    }

    res.status(200).json({ message: 'programm URL updated successfully', updatedClient });
  } catch (error) {
    res.status(500).json({ message: 'Error updating program URL', error });
  }
};

const getCodeByMerchantNumber = async (req, res) => {
  try {
    const merchantNumber = req.header('merchantMSISDN');

    if (!merchantNumber) {
      return res.status(400).json({ message: 'Missing merchantMSISDN in headers' });
    }

    // Step 1: Find the Merchant by merchantMSISDN
    const merchant = await Merchant.findOne({ merchantMSISDN: merchantNumber });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Step 2: Find Clients for this Merchant
    const clients = await Client.find({ merchantMSISDN: merchant._id }, '-url')
      .populate({
        path: 'merchantMSISDN',
        select: 'merchantMSISDN -_id'
      });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching codes', error });
  }
};

const getUrlOfProgramByMerchentNumber = async (req, res) => {
  try {
    const merchantNumber = req.header('merchantMSISDN'); // e.g., 0999888777

    if (!merchantNumber) {
      return res.status(400).json({ message: 'Missing merchantMSISDN in headers' });
    }

    // Step 1: Find the Merchant by merchantMSISDN (number)
    const merchant = await Merchant.findOne({ merchantMSISDN: merchantNumber });

    if (!merchant) {
      return res.status(404).json({ message: 'Merchant not found' });
    }

    // Step 2: Find Clients using merchant._id, exclude 'code'
    const clients = await Client.find(
      { merchantMSISDN: merchant._id },
      '-code' // Exclude `code` field, include others like `url`, `programmName`, etc.
    ).populate({
      path: 'merchantMSISDN',
      select: 'merchantMSISDN -_id' // include merchantMSISDN string only
    });

    res.status(200).json(clients);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching clients', error });
  }
};





module.exports = {
    saveServer,
    CreateHashCode,
    addUrl,
    getUrl,
    getToken,
    paymentRequest,
    paymentConfirmation,
    resendOTP,
    getAllCodesAndPrograms,
    getAllUrlsAndPrograms,
    deleteCodeById,
    updateUrlById,
    getCodeByMerchantNumber,
    getUrlOfProgramByMerchentNumber,
};
