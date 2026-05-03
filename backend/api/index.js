require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const leaderboardRoutes = require('../routes/leaderboard');
const adminRoutes = require('../routes/admin');
const userRoutes = require('../routes/user');
const cronRoutes = require('../routes/cron')
const oTMigrationRoutes = require('../routes/oneTimeMigrations')
const cors = require('cors');

const app = express();


// Middleware
app.use(cors({
    origin: "*"
}))

app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});
app.use(express.json());

app.use("/api/leaderboards" , leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/oTMigrate", oTMigrationRoutes);
app.get("/", (req, res) => res.status(200).json({ message: process.env.PORT}));

const URI = process.env.MONGODB_URI;

mongoose.connect(URI).catch((err) => {
    console.log('Cannot connect to db: ' + err);
});

module.exports = app;