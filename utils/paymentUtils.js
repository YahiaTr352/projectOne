const Client = require("../models/clientModel");
const Merchant = require("../models/merchantModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const isValidString = (val) => {
    if (typeof val !== 'string' || val.trim() === '') {
      return false;
    }
    
    const lowerVal = val.toLowerCase();
  
    if (lowerVal.includes('<script') || lowerVal.includes('</script')) {
      return false;
    }
  
    const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(val);
    if (hasHTMLTags) {
      return false;
    }
  
    return true;
  };  

  const isValidBoolean = (val) => {
    if (val === undefined || val === null) return false;
  
    const lowerVal = String(val).toLowerCase();
  
    if (lowerVal.includes('<script') || lowerVal.includes('</script')) {
      return false;
    }
  
    const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(val);
    if (hasHTMLTags) return false;
  
    return lowerVal === 'true' || lowerVal === 'false' || typeof val === 'boolean';
  };

  const isValidOTP = (otp) => {
    if (typeof otp !== 'string' || otp.trim() === '') {
      return false;
    }
  
    const trimmedOTP = otp.trim();
  
    const lowerVal = trimmedOTP.toLowerCase();
    const hasScript = lowerVal.includes('<script') || lowerVal.includes('</script');
    const hasHTMLTags = /<\/?[a-z][\s\S]*>/i.test(trimmedOTP);
  
    if (hasScript || hasHTMLTags) {
      return false;
    }
  
    return /^\d{6}$/.test(trimmedOTP);
  };


const isValidNumber = (val) => !isNaN(Number(val));

const isValidAmount = (value) => {
    const regex = /^(?!0*(\.0{1,2})?$)\d+(\.\d{1,2})?$/;
    return regex.test(value);
};

const calculateFees = (amount) => {
    const numeriAmount = parseFloat(amount)
    return numeriAmount * 0.02;
}

const generateNumericCode = (length) => {
    let code = '';
    for (let i = 0; i < length; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

const findMerchantAndClient = async (merchantMSISDN, code) => {
    const merchant = await Merchant.findOne({ merchantMSISDN });
    if (!merchant) return { merchant: null, matchedClient: null };

    const clients = await Client.find({ merchantMSISDN: merchant._id });

    let matchedClient = null;

    for (const client of clients) {
        const isMatch = await bcrypt.compare(code, client.code);
        if (isMatch) {
            matchedClient = client;
            break;
        }
    }

    return { merchant, matchedClient };
};

const phoneRegex = /^0?9\d{8}$/;

const validateCustomerPhoneNumber = (phoneNumber) => {
  return phoneRegex.test(phoneNumber) && !isNaN(phoneNumber);
};


const validateMerchantPhoneNumber = (phoneNumber) => {
    const phoneRegex = /^\+[1-9]\d{7,14}$/;
    return phoneRegex.test(phoneNumber);
}

const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error };
    }
};


  
module.exports = {
    isValidString,
    isValidBoolean,
    isValidOTP,
    isValidNumber,
    isValidAmount,
    calculateFees,
    generateNumericCode,
    findMerchantAndClient,
    validateCustomerPhoneNumber,
    validateMerchantPhoneNumber,
    verifyToken
}