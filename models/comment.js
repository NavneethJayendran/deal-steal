const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = mongoose.Schema({
  user: {type: Schema.Types.ObjectId, ref: "User"},
  post: {type: Schema.Types.ObjectId, ref: "Post"},
  creationDate: Date,
  text: String,
  replies: {type: Schema.Types.ObjectId, ref: "Comment"},
  replyTo: {type: Schema.Types.ObjectId, ref: "Comment"}
});

module.exports = mongoose.model("Comment", commentSchema);


