const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        minlength: 6
    },

    avatar: {
        type: String,
        default: ""
    },
    wallpaper: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        trim: true,
        maxlength: 240,
        default: ""
    },
    goals: {
        type: [String],
        default: []
    }
},
{
    timestamps: true
}
);

module.exports = mongoose.model("User", userSchema);