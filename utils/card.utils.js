// Generate random card number based on card type
exports.generateCardNumber = (cardType) => {
    let prefix;
    
    switch(cardType) {
        case 'visa':
            prefix = '4';
            break;
        case 'mastercard':
            prefix = '5';
            break;
        case 'amex':
            prefix = '3';
            break;
        case 'discover':
            prefix = '6';
            break;
        default:
            prefix = '4';
    }
    
    // Generate remaining digits
    let cardNumber = prefix;
    for (let i = 0; i < 15; i++) {
        cardNumber += Math.floor(Math.random() * 10);
    }
    
    return cardNumber;
};

// Generate random CVV (3 or 4 digits)
exports.generateCVV = () => {
    const length = Math.random() > 0.5 ? 3 : 4;
    let cvv = '';
    for (let i = 0; i < length; i++) {
        cvv += Math.floor(Math.random() * 10);
    }
    return cvv;
};

// Generate expiry date (3 years from now)
exports.generateExpiryDate = () => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return date;
};