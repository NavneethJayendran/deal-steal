const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = mongoose.Schema({
  username: {
    type: String,
    required: [true, 'someone posted this']
  }, 
  category: String,
  creationDate: {type: Date, default: Date()},
  editDate: {type: Date, default: Date()},
  text: String,
});

module.exports = mongoose.model("Post", postSchema);

