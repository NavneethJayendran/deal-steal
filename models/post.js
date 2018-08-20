const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref: "User"},
  category: String,
  creationDate: Date,
  text: String,
  comments: {type: Schema.Types.ObjectId, ref: "Comment"}
});

module.exports = mongoose.model("Post", postSchema);

