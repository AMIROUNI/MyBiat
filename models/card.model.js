const mongoose = require('mongoose');

const cardSchema = new mongoose.Schema({
    cardNumber: {
        type: String,
        required: [true, 'Card number is required'],
        unique: true,
        trim: true,
        match: [/^\d{16}$/, 'Card number must be 16 digits']
    },
    balance: {
        type: Number,
        default: 1000,
        min: [0, 'Balance cannot be negative']
    },
    cardHolderName: {
        type: String,
        required: [true, 'Card holder name is required'],
        trim: true
    },
    expiryDate: {
        type: Date,
        required: [true, 'Expiry date is required'],
        validate: {
            validator: function(expiry) {
                return expiry > new Date();
            },
            message: 'Card must not be expired'
        }
    },
    cvv: {
        type: String,
        required: [true, 'CVV is required'],
        match: [/^\d{3,4}$/, 'CVV must be 3 or 4 digits']
    },
    cardType: {
        type: String,
        required: [true, 'Card type is required'],
        enum: ['visa', 'mastercard', 'amex', 'discover'],
        default: 'visa'
    },
    cardBrand: {
        type: String,
        enum: ['classic', 'gold', 'platinum', 'infinite', 'business'],
        default: 'classic'
    },
    dailyLimit: {
        type: Number,
        default: 5000
    },
    monthlyLimit: {
        type: Number,
        default: 15000
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isVirtual: {
        type: Boolean,
        default: false
    },
    issueDate: {
        type: Date,
        default: Date.now
    },
    transactions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction'
    }],
    pin: {
        type: String,
        required: [true, 'PIN is required'],
        match: [/^\d{4}$/, 'PIN must be 4 digits']
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            // Hide sensitive information
            delete ret.cvv;
            delete ret.pin;
            delete ret.__v;
            return ret;
        }
    }
});

// Virtual for masked card number
cardSchema.virtual('maskedCardNumber').get(function() {
    return '•••• •••• •••• ' + this.cardNumber.slice(-4);
});

// Virtual for formatted expiry date
cardSchema.virtual('formattedExpiry').get(function() {
    const month = this.expiryDate.getMonth() + 1;
    const year = this.expiryDate.getFullYear().toString().slice(-2);
    return `${month.toString().padStart(2, '0')}/${year}`;
});

module.exports = mongoose.model('Card', cardSchema);