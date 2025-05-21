const PaymentTransaction = require('../models/paymentTransaction');

const ensureTTLIndex = async () => {
  try {
    await PaymentTransaction.collection.createIndex(
      { createdAt: 1 },
      {
        expireAfterSeconds: 864000,
        partialFilterExpression: { success: false }
      }
    );
    console.log("TTL index created (only for failed transactions).");
  } catch (err) {
    console.error("Failed to create TTL index:", err);
  }
};

module.exports = ensureTTLIndex;