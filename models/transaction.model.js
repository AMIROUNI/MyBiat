const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

// Export both the schema and the model
module.exports = {
    Transaction: mongoose.model('Transaction', transactionSchema),
    transactionSchema
};
