// auth.middleware.js

exports.isAuthenticated = (req, res, next) => {
    // Check if user is logged in
    if (req.session && req.session.user) {
        return next(); // User is authenticated, continue to the route
    }
    
    // User is not authenticated
    res.redirect('/login');
};

// Optional: Middleware to prevent logged-in users from accessing auth pages
exports.redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    next();
};