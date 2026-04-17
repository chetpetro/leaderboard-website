const User = require('../models/userModel');

const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user?._id) {
            return res.status(401).json({ error: 'request is not authorized' });
        }

        const user = await User.findById(req.user._id).select('isAdmin');
        if (!user || user.isAdmin !== true) {
            return res.status(403).json({ error: 'Admin privileges required' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'request is not authorized' });
    }
};

module.exports = requireAdmin;


