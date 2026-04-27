const crypto = require('crypto');

const getProvidedSecret = (req) => {
    const authorization = req.headers.authorization || '';

    if (authorization.startsWith('Bearer ')) {
        return authorization.slice(7);
    }

    return req.headers['x-cron-secret'];
};

const safeEqual = (provided, expected) => {
    const providedBuffer = Buffer.from(provided || '', 'utf8');
    const expectedBuffer = Buffer.from(expected || '', 'utf8');

    if (providedBuffer.length !== expectedBuffer.length) {
        return false;
    }

    return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
};

const requireCronSecret = (req, res, next) => {
    if (req.headers['x-vercel-cron']) {
        return next();
    }

    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
        return res.status(500).json({ error: 'CRON_SECRET not configured' });
    }

    const providedSecret = getProvidedSecret(req);

    if (!providedSecret) {
        return res.status(401).json({ error: 'Cron secret required' });
    }

    if (!safeEqual(providedSecret, expectedSecret)) {
        return res.status(403).json({ error: 'Invalid cron secret' });
    }

    return next();
};

module.exports = requireCronSecret;
