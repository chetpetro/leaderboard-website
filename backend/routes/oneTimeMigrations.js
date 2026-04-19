// Endpoint if i want to execute some backend code in production. Ik there a better ways but this is the fastest.
const express = require('express');
const { oneTimeMigrate } = require('../controllers/one-time-migrations-controller');
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();

router.use(requireAuth);
router.use(requireAdmin);
router.get('/', oneTimeMigrate);

module.exports = router;