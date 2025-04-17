const User = require('../models/user.model');
const Card = require('../models/card.model');
const bcrypt = require('bcryptjs');
const { generateCardNumber, generateCVV, generateExpiryDate } = require('../utils/card.utils');

exports.showRegister = (req, res) => {
    res.render('register',{ error: null });
};

exports.showLogin = (req, res) => {
    res.render('login', { error: null });  
};
exports.register = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.render('register', { error: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = new User({ 
            name, 
            email, 
            password: hashedPassword,
            accountType: 'personal' // Default account type
        });

        // Generate card details
        const cardData = {
            cardNumber: generateCardNumber('visa'), // Default to visa
            cardHolderName: name,
            expiryDate: generateExpiryDate(),
            cvv: generateCVV(),
            cardType: 'visa',
            cardBrand: 'classic', // Default to classic
            isVirtual: false,
            pin: '1234', // Default PIN, should be changed by user
            balance: 1000 // Initial balance
        };

        // Create card
        const card = await Card.create(cardData);

        // Assign card to user and set as default
        newUser.cards.push(card._id);
        newUser.preferences.defaultCard = card._id;

        await newUser.save();

        res.redirect('/login');
    } catch (error) {
        console.error(error);
        res.render('register', { error: 'Registration failed. Please try again.' });
    }
};

exports.showLoading = (req, res) => {
    res.render('loading');
};



exports.dashboard = (req, res) => {
    res.render('dashboard', { error: null });  
};
exports.dashboard = async (req, res) => {
    try {
        // Get user from session
        const userId = req.session.user.id;
        
        const user = await User.findById(userId)
            .populate({
                path: 'cards',
                select: '-cvv -pin -__v'
            })
            .populate('preferences.defaultCard');

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        // Get the primary card
        const primaryCard = user.getPrimaryCard();
        const balance = primaryCard ? primaryCard.balance : 0;

        res.render('dashboard', { 
            user: {
                ...user.toObject(),
                email: req.session.user.email // Add email from session
            },
            balance,
            primaryCard: primaryCard ? primaryCard.toObject() : null,
            cards: user.cards // Pass all cards to the view
        });
    } catch (error) {
        console.error(error);
        res.redirect('/login');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).populate('preferences.defaultCard');
        if (!user) return res.render('login', { error: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.render('login', { error: 'Invalid credentials' });

        // Store user info in session
        req.session.user = {
            id: user._id,
            email: user.email,
            name: user.name
        };

        // Redirect to dashboard
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('login', { error: 'Login failed. Please try again.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Session destruction error:', err);
        }
        res.redirect('/login');
    });
};


exports.showTransfer = (req, res) => {
    res.render('transfer', { userId: req.params.userId });
};

exports.transferMoney = async (req, res) => {
    const { senderId, receiverEmail, amount } = req.body;

    try {
        // Find users and populate their default cards
        const sender = await User.findById(senderId).populate('preferences.defaultCard');
        const receiver = await User.findOne({ email: receiverEmail }).populate('preferences.defaultCard');

        if (!sender || !receiver) {
            return res.render('transfer', { 
                userId: senderId,
                error: 'Sender or receiver not found' 
            });
        }

        // Check if both users have default cards
        if (!sender.preferences.defaultCard || !receiver.preferences.defaultCard) {
            return res.render('transfer', { 
                userId: senderId,
                error: 'Both users must have an active card' 
            });
        }

        // Get the card documents
        const senderCard = await Card.findById(sender.preferences.defaultCard);
        const receiverCard = await Card.findById(receiver.preferences.defaultCard);

        // Check if sender has sufficient balance
        if (senderCard.balance < amount) {
            return res.render('transfer', { 
                userId: senderId,
                error: 'Insufficient balance on your card' 
            });
        }

        // Perform the transfer
        senderCard.balance -= parseFloat(amount);
        receiverCard.balance += parseFloat(amount);

        // Record transactions for both users
        const transactionDate = new Date();
        
        sender.transactions.push({
            amount: -amount,
            receiver: receiver._id,
            date: transactionDate,
            type: 'transfer',
            description: `Transfer to ${receiver.name}`
        });

        receiver.transactions.push({
            amount: amount,
            sender: sender._id,
            date: transactionDate,
            type: 'transfer',
            description: `Transfer from ${sender.name}`
        });

        // Save all changes
        await Promise.all([
            senderCard.save(),
            receiverCard.save(),
            sender.save(),
            receiver.save()
        ]);

        res.redirect(`/dashboard/${sender._id}`);

    } catch (error) {
        console.error('Transfer error:', error);
        res.render('transfer', { 
            userId: senderId,
            error: 'An error occurred during transfer. Please try again.' 
        });
    }
};