require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const leaderboardRoutes = require('./routes/leaderboard');

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

app.use("/api/leaderboards" , leaderboardRoutes);

const PORT = process.env.PORT;
const URI = process.env.MONGO_URI;
mongoose.connect(URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Connected to db & Listening on port: ${PORT}`));  
    })
    .catch((err) => {
        console.log('Cannot connect to db: ' + err);
    });