const express = require('express');
const router = express.Router();
const cardController = require('../controllers/card.controller');
const { protect } = require('../middleware/auth.middleware');

// Create a new card
router.post('/', protect, cardController.createCard);

// Get all cards for user
router.get('/', protect, cardController.getUserCards);

// Get single card
router.get('/:id', protect, cardController.getCard);

// Update card
router.put('/:id', protect, cardController.updateCard);

// Toggle card status (block/unblock)
router.patch('/:id/status', protect, cardController.toggleCardStatus);

// Set default card
router.patch('/:id/default', protect, cardController.setDefaultCard);

// Delete card
router.delete('/:id', protect, cardController.deleteCard);

module.exports = router;