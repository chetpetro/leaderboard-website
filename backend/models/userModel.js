const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    discordID: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    points: {
        type: Number,
        default: 0
    }
})

userSchema.statics.signup = async function(userName, discordID, password) {

    if (!userName || !password || !discordID) throw Error('Empty Feild');

    const userNameCheck = await this.findOne({ userName });
    if (userNameCheck) throw Error('Username already exists.');

    const discordIDCheck = await this.findOne({ discordID });
    if (discordIDCheck) throw Error('Discord ID already exists.');

    const salt = await bcrypt.genSalt();
    const hash = await bcrypt.hash(password, salt);

    const user = await this.create({ userName, discordID, password: hash });

    return user;
}

userSchema.statics.signupDiscord = async function(tokenType, accessToken) {

    if (!tokenType || !accessToken) throw Error('Empty Feild');

    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { authorization: `${tokenType} ${accessToken}` }
    })
    const json = await response.json();
    const userName = json.username;
    const discordID = json.id;
    
    const userNameCheck = await this.findOne({ userName });
    if (userNameCheck) throw Error('Username already exists.');

    const discordIDCheck = await this.findOne({ discordID });
    if (discordIDCheck) throw Error('Discord ID already exists.');

    const user = await this.create({ userName, discordID });

    return user;
}

userSchema.statics.login = async function(userName, password) {

    if (!userName || !password) throw Error('Empty Feild');

    const user = await this.findOne({ userName });
    if (!user) throw Error('Incorrect Username');

    const match = await bcrypt.compare(password, user.password);
    if(!match) throw Error("Incorrect Password");

    return user;
}

userSchema.statics.loginDiscord = async function(tokenType, accessToken) {

    if (!tokenType || !accessToken) throw Error('Empty Feild');

    const response = await fetch('https://discord.com/api/users/@me', {
        headers: { authorization: `${tokenType} ${accessToken}` }
    })
    const json = await response.json();
    const discordID = json.id;

    const user = await this.findOne({ discordID });

    return user;
}

module.exports = mongoose.model('User', userSchema);