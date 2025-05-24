const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({

    companyName : {type : String, required : true},
    programmName : {type : String, required : true},
    customerMSISDN: { type: mongoose.Schema.Types.ObjectId, ref: "Customer"},
    merchantMSISDN:  { type: mongoose.Schema.Types.ObjectId, ref: "Merchant"},
    amount: {type : Number , required : true},
    fees : {type : Number},
    transactionID: { type: String },
    success : {type : Boolean , default : false},
    createdAt: { type: Date, default: Date.now}
});

const PaymentTransaction = mongoose.model("PaymentTransaction" , paymentTransactionSchema);

module.exports = PaymentTransaction;
