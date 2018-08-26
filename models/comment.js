const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = mongoose.Schema({
  username: {
    type: String, 
    required: [true, 'someone posted this comment']
  },
  post: {type: Schema.Types.ObjectId, ref: "Post"},
  creationDate: {type: Date, default: Date.now },
  editDate: {type: Date, default: Date.now },
  text: String,
  replyTo: {
    type: Schema.Types.ObjectId, 
    ref: "Comment",
    required: [false, 'can be direct reply to post']
  }
});

module.exports = mongoose.model("Comment", commentSchema);


