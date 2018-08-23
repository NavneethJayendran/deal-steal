const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = mongoose.Schema({
  username: String,
  post: {type: Schema.Types.ObjectId, ref: "Post"},
  creationDate: {type: Date, default: Date()},
  editDate: {type: Date, default: Date()},
  text: String,
  replyTo: {type: Schema.Types.ObjectId, ref: "Comment"}
});

module.exports = mongoose.model("Comment", commentSchema);


