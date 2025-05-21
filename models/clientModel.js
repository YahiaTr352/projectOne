const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({

    companyName : {type : String, required : true},
    programmName : {type : String, required : true},
    merchantMSISDN:  { type: mongoose.Schema.Types.ObjectId, ref: "Merchant"},
    code : {type : String, required : true},
    url : {type : String},
    createdAt: { type: Date, default: Date.now }
})

const Client = mongoose.model("Client" , clientSchema);

module.exports = Client;