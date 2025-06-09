const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.SECRET_KEY;

const encryptBalance = (balance) => {
    if (typeof balance !== 'string') {
        balance = balance.toString();
    }
    return CryptoJS.AES.encrypt(balance, SECRET_KEY).toString();
};

const decryptBalance = (encryptedBalance) => {
    const bytes = CryptoJS.AES.decrypt(encryptedBalance, SECRET_KEY);
    const originalBalance = bytes.toString(CryptoJS.enc.Utf8);
    return parseFloat(originalBalance);
};

module.exports = {
    encryptBalance,
    decryptBalance
};