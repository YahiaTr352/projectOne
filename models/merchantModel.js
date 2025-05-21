const mongoose = require("mongoose");

const merchantSchema = new mongoose.Schema({

    merchantMSISDN : {type : String, required : true},
    hasMerchantWallet : {type : Boolean , required : true},
    balance : {type : String, required : true},
    active : {type : Boolean , default : true},
    createdAt: { type: Date, default: Date.now }
})

const Merchant = mongoose.model("Merchant" , merchantSchema);

module.exports = Merchant;