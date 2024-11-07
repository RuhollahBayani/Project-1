const mongoose = require('mongoose');
const { subscribe } = require('./user-routes');

const userSchema = new mongoose.Schema(
    {
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: false
    },
    dob: {
        type: Date,
        required: false
    },
    avatar: {
        type: String,
        required: false    
    },
    dateCreated: {
        type: Date
    },
    subscription: {
        type: Boolean,
        required: false
    }
}
);



const UserModel = mongoose.model('users', userSchema);

module.exports = UserModel;