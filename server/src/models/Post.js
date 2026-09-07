import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // slug is backend-generated (see utils/slugify.js) - never trust a
    // client-supplied slug, since collision resolution must be authoritative.
    slug: { type: String, required: true, unique: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    content: { type: String, required: true },
    excerpt: { type: String, default: '', trim: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    status: { type: String, enum: ['draft', 'published'], default: 'draft', index: true },
    // wordCount/readingTime are computed server-side from `content` on every
    // save so they can never be spoofed by the client and always match.
    wordCount: { type: Number, default: 0 },
    readingTime: { type: Number, default: 1 },
    coverImage: { type: String, default: '' },
    publishedAt: { type: Date, default: null },
    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

postSchema.index({ title: 'text', content: 'text', excerpt: 'text' });
postSchema.index({ status: 1, publishedAt: -1 });

export default mongoose.model('Post', postSchema);
