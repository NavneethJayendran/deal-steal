const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');


const userSchema = mongoose.Schema({
  username: { 
    type: String,
    required: [true, "user must have username"],
    index: {unique: true}
  },
  password: String, 
  creationDate: {type: Date, default: Date.now},
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);

