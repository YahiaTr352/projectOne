const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

    customerMSISDN : {type : String, required : true},
    hasCustomerWallet : {type : Boolean, required : true},
    active : {type : Boolean , default : true},
    balance : {type : String , required : true},
    createdAt: { type: Date, default: Date.now }
})

const Customer = mongoose.model("Customer" , customerSchema);

module.exports = Customer;