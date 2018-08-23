const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = mongoose.Schema({
  username: String, 
  category: String,
  creationDate: {type: Date, default: Date()},
  editDate: {type: Date, default: Date()},
  text: String,
  comments: {type: Schema.Types.ObjectId, ref: "Comment"}
});

module.exports = mongoose.model("Post", postSchema);

