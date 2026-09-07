import { Router } from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';
import { createPostSchema, updatePostSchema, listPostsQuerySchema } from '../schemas/postSchemas.js';
import { generateUniqueSlug } from '../utils/slugify.js';
import { computeWordStats } from '../utils/content.js';
import { sanitizeMarkdownSource } from '../utils/sanitize.js';
import { ApiError } from '../middleware/errorHandler.js';

const router = Router();

// GET / - published only, paginated, filter by tag, full-text search
router.get('/', validateQuery(listPostsQuerySchema), async (req, res, next) => {
  try {
    const { page, limit, tag, search } = req.query;
    const filter = { status: 'published' };
    if (tag) filter.tags = tag.toLowerCase();
    if (search) filter.$text = { $search: search };

    const [posts, total] = await Promise.all([
      Post.find(filter)
        .sort(search ? { score: { $meta: 'textScore' } } : { publishedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name email')
        .lean(),
      Post.countDocuments(filter),
    ]);

    res.json({
      posts,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const post = await Post.findOneAndUpdate(
      { slug: req.params.slug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name email');
    if (!post) throw new ApiError(404, 'Post not found');
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, validateBody(createPostSchema), async (req, res, next) => {
  try {
    const { title, content, excerpt, tags, status, coverImage } = req.body;
    const cleanContent = sanitizeMarkdownSource(content);
    const slug = await generateUniqueSlug(title, Post);
    const { wordCount, readingTime } = computeWordStats(cleanContent);

    const post = await Post.create({
      title,
      slug,
      author: req.user.id,
      content: cleanContent,
      excerpt,
      tags,
      status,
      coverImage,
      wordCount,
      readingTime,
      publishedAt: status === 'published' ? new Date() : null,
    });

    res.status(201).json({ post });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validateBody(updatePostSchema), async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new ApiError(404, 'Post not found');
    if (post.author.toString() !== req.user.id) throw new ApiError(403, 'Not the post owner');

    const { title, content, excerpt, tags, status, coverImage } = req.body;

    if (title && title !== post.title) {
      post.slug = await generateUniqueSlug(title, Post, post._id);
      post.title = title;
    }
    if (content !== undefined) {
      const cleanContent = sanitizeMarkdownSource(content);
      post.content = cleanContent;
      const { wordCount, readingTime } = computeWordStats(cleanContent);
      post.wordCount = wordCount;
      post.readingTime = readingTime;
    }
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (tags !== undefined) post.tags = tags;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (status !== undefined && status !== post.status) {
      post.status = status;
      if (status === 'published' && !post.publishedAt) post.publishedAt = new Date();
    }

    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new ApiError(404, 'Post not found');
    if (post.author.toString() !== req.user.id) throw new ApiError(403, 'Not the post owner');
    await post.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/publish', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new ApiError(404, 'Post not found');
    if (post.author.toString() !== req.user.id) throw new ApiError(403, 'Not the post owner');
    post.status = 'published';
    if (!post.publishedAt) post.publishedAt = new Date();
    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/unpublish', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new ApiError(404, 'Post not found');
    if (post.author.toString() !== req.user.id) throw new ApiError(403, 'Not the post owner');
    post.status = 'draft';
    await post.save();
    res.json({ post });
  } catch (err) {
    next(err);
  }
});

// Author's own posts (any status) - used by /dashboard
router.get('/mine/all', requireAuth, async (req, res, next) => {
  try {
    const posts = await Post.find({ author: req.user.id }).sort({ updatedAt: -1 }).lean();
    res.json({ posts });
  } catch (err) {
    next(err);
  }
});

router.post('/:id/bookmark', requireAuth, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) throw new ApiError(404, 'Post not found');
    const user = await User.findById(req.user.id);
    const idx = user.bookmarkedPosts.findIndex((p) => p.toString() === post._id.toString());
    let bookmarked;
    if (idx >= 0) {
      user.bookmarkedPosts.splice(idx, 1);
      bookmarked = false;
    } else {
      user.bookmarkedPosts.push(post._id);
      bookmarked = true;
    }
    await user.save();
    res.json({ bookmarked });
  } catch (err) {
    next(err);
  }
});

export default router;
