const Card = require('../models/card.model');
const User = require('../models/user.model');
const { generateCardNumber, generateCVV, generateExpiryDate } = require('../utils/card.utils');

// @desc    Create a new card for user
// @route   POST /api/cards
// @access  Private
exports.createCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const { cardType, cardBrand, isVirtual, pin } = req.body;

        // Verify user exists
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if user can have more cards (premium users might have more)
        const maxCards = user.accountType === 'premium' ? 5 : 3;
        if (user.cards.length >= maxCards) {
            return res.status(400).json({ 
                success: false, 
                message: `You can have maximum ${maxCards} cards. Upgrade to premium for more.`
            });
        }

        // Generate card details
        const cardData = {
            cardNumber: generateCardNumber(cardType),
            cardHolderName: user.name,
            expiryDate: generateExpiryDate(),
            cvv: generateCVV(),
            cardType,
            cardBrand,
            isVirtual,
            pin,
            dailyLimit: cardBrand === 'platinum' ? 10000 : 5000,
            monthlyLimit: cardBrand === 'platinum' ? 30000 : 15000
        };

        // Create card
        const card = await Card.create(cardData);

        // Add card to user
        user.cards.push(card._id);
        
        // If this is user's first card, set as default
        if (user.cards.length === 1) {
            user.preferences.defaultCard = card._id;
        }

        await user.save();

        // Return card without sensitive data
        const cardResponse = card.toJSON();

        res.status(201).json({
            success: true,
            data: cardResponse
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Get all cards for user
// @route   GET /api/cards
// @access  Private
exports.getUserCards = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).populate({
            path: 'cards',
            select: '-cvv -pin -__v'
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            count: user.cards.length,
            data: user.cards
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Get single card
// @route   GET /api/cards/:id
// @access  Private
exports.getCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.id;

        // Verify user owns this card
        const user = await User.findOne({ 
            _id: userId, 
            cards: { $in: [cardId] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Card not found or not owned by user' 
            });
        }

        const card = await Card.findById(cardId).select('-cvv -pin -__v');

        res.status(200).json({
            success: true,
            data: card
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Update card
// @route   PUT /api/cards/:id
// @access  Private
exports.updateCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.id;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.cardNumber;
        delete updates.expiryDate;
        delete updates.cvv;
        delete updates.issueDate;
        delete updates.transactions;

        // Verify user owns this card
        const user = await User.findOne({ 
            _id: userId, 
            cards: { $in: [cardId] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Card not found or not owned by user' 
            });
        }

        // Update card
        const card = await Card.findByIdAndUpdate(
            cardId, 
            updates, 
            { new: true, runValidators: true }
        ).select('-cvv -pin -__v');

        res.status(200).json({
            success: true,
            data: card
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Block/unblock card
// @route   PATCH /api/cards/:id/status
// @access  Private
exports.toggleCardStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.id;
        const { isActive } = req.body;

        // Verify user owns this card
        const user = await User.findOne({ 
            _id: userId, 
            cards: { $in: [cardId] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Card not found or not owned by user' 
            });
        }

        // Update card status
        const card = await Card.findByIdAndUpdate(
            cardId, 
            { isActive }, 
            { new: true }
        ).select('-cvv -pin -__v');

        res.status(200).json({
            success: true,
            message: `Card ${isActive ? 'activated' : 'blocked'} successfully`,
            data: card
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Set default card
// @route   PATCH /api/cards/:id/default
// @access  Private
exports.setDefaultCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.id;

        // Verify user owns this card
        const user = await User.findOne({ 
            _id: userId, 
            cards: { $in: [cardId] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Card not found or not owned by user' 
            });
        }

        // Update default card preference
        user.preferences.defaultCard = cardId;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Default card updated successfully',
            data: {
                defaultCard: cardId
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};

// @desc    Delete card
// @route   DELETE /api/cards/:id
// @access  Private
exports.deleteCard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cardId = req.params.id;

        // Verify user owns this card
        const user = await User.findOne({ 
            _id: userId, 
            cards: { $in: [cardId] } 
        });

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Card not found or not owned by user' 
            });
        }

        // Remove card from user's cards array
        user.cards = user.cards.filter(id => id.toString() !== cardId);
        
        // If deleted card was default, set new default or clear
        if (user.preferences.defaultCard && 
            user.preferences.defaultCard.toString() === cardId) {
            user.preferences.defaultCard = user.cards.length > 0 ? user.cards[0] : null;
        }

        await user.save();
        
        // Delete card document
        await Card.findByIdAndDelete(cardId);

        res.status(200).json({
            success: true,
            message: 'Card deleted successfully'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
};