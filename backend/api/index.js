require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const leaderboardRoutes = require('../routes/leaderboard');
const userRoutes = require('../routes/user');
const cronRoutes = require('../routes/cron')
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: "*",
    credentials: true
}))

// http redirect
app.use((req, res, next) => {
    console.log(req.headers ,req.path, req.method);
    next();
});
app.use("*", function (req, res, next) {
    if ("https" !== req.headers["x-forwarded-proto"]) {
        res.redirect("https://" + req.hostname + req.url);
    } else {
        // Continue to other routes if we're not redirecting
        next();
    }
});

app.use(express.json());

app.use("/api/leaderboards" , leaderboardRoutes);
app.use("/api/user", userRoutes);
app.use("/api/cron", cronRoutes);
app.get("/", (req, res) => res.status(200).json({ message: process.env.PORT}));

const PORT = process.env.PORT;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Connected to db & Listening on port: ${PORT}`));
    })
    .catch((err) => {
        console.log('Cannot connect to db: ' + err);
    });
