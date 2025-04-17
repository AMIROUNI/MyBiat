const mongoose = require('mongoose');
const { transactionSchema } = require('./transaction.model');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [8, 'Password must be at least 8 characters']
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, 'Please fill a valid phone number']
    },
    address: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
    },
    dateOfBirth: {
        type: Date,
        validate: {
            validator: function(dob) {
                return dob < new Date();
            },
            message: 'Date of birth must be in the past'
        }
    },
    profilePicture: String,
    accountType: {
        type: String,
        enum: ['personal', 'business', 'premium'],
        default: 'personal'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    transactions: [transactionSchema],
    cards: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Card'
    }],
    preferences: {
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'light'
        },
        notifications: {
            email: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            push: { type: Boolean, default: true }
        },
        defaultCard: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Card'
        }
    },
    security: {
        twoFactorEnabled: { type: Boolean, default: false },
        lastPasswordChange: Date,
        lastLogin: Date,
        loginAttempts: { type: Number, default: 0 },
        accountLocked: { type: Boolean, default: false },
        lockUntil: Date
    },
    accountDetails: {
        accountNumber: {
            type: String,
            unique: true,
            match: [/^\d{10,20}$/, 'Account number must be between 10-20 digits']
        },
        iban: {
            type: String,
            unique: true,
            match: [/^[A-Z]{2}\d{2}[A-Z\d]{1,30}$/, 'Invalid IBAN format']
        },
        swiftCode: {
            type: String,
            match: [/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code']
        }
    }
}, { 
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.__v;
            delete ret.security;
            return ret;
        }
    }
});

// Virtual for user's age
userSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const diff = Date.now() - this.dateOfBirth.getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
});

// Virtual for formatted address
userSchema.virtual('formattedAddress').get(function() {
    if (!this.address) return null;
    const { street, city, state, postalCode, country } = this.address;
    return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
});

// Method to get primary card
userSchema.methods.getPrimaryCard = function() {
    return this.cards.find(card => card._id.equals(this.preferences.defaultCard)) || 
           this.cards[0] || 
           null;
};

// Pre-save hook to generate account details if not provided
userSchema.pre('save', function(next) {
    if (!this.accountDetails.accountNumber) {
        this.accountDetails.accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }
    if (!this.accountDetails.iban) {
        this.accountDetails.iban = `TN${Math.floor(10 + Math.random() * 90)}${this.accountDetails.accountNumber}`;
    }
    next();
});

module.exports = mongoose.model('User', userSchema);