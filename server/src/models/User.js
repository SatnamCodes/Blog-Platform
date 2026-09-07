import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    // 'admin' is a clean extension point: no admin-only routes exist yet in
    // this base project, but requireRole middleware already supports it so
    // adding admin features later doesn't require touching auth plumbing.
    role: { type: String, enum: ['author', 'admin', 'reader'], default: 'reader' },
    bookmarkedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: [] }],
  },
  { timestamps: true }
);

export default mongoose.model('User', userSchema);
