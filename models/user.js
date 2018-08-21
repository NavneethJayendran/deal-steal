const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = mongoose.Schema({
  username: String,
  password: String, 
  creationDate: {type: Date, default: Date()},
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);

