require('dotenv').config()
const express = require('express');
const mongoose = require('mongoose');
const leaderboardRoutes = require('../routes/leaderboard');
const userRoutes = require('../routes/user');
const schedule = require('node-schedule');
const newFeaturedLeaderboard = require('../controllers/serverController');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    origin: ["https://leaderboard-website-frontend.vercel.app/"],
    credentials: true
}))
app.use(express.json());
app.use((req, res, next) => {
    console.log(req.path, req.method);
    next();
});

app.get("/", (req, res) => res.status(200).json({ message: "Hello World"}));
app.use("/api/leaderboards" , leaderboardRoutes);
app.use("/api/user", userRoutes);

const PORT = process.env.PORT;
const URI = process.env.MONGODB_URI;

mongoose.connect(URI)
    .then(() => {
        app.listen(PORT, () => console.log(`Connected to db & Listening on port: ${PORT}`));
        
        const job = schedule.scheduleJob('* * * * 0', function(){
            //newFeaturedLeaderboard();
        });
    })
    .catch((err) => {
        console.log('Cannot connect to db: ' + err);
    });
