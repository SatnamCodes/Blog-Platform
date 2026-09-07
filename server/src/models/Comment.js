import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
    // Self-reference for nested replies: a comment tree is naturally
    // recursive (a reply is just a comment whose parent is another
    // comment), so one schema with a nullable self-ref models arbitrary
    // depth without a separate "Reply" collection or a fixed depth limit.
    parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    likeCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
