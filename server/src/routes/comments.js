import { Router } from 'express';
import Comment from '../models/Comment.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createCommentSchema, updateCommentSchema } from '../schemas/commentSchemas.js';
import { ApiError } from '../middleware/errorHandler.js';
import { commentRateLimiter } from '../middleware/rateLimit.js';

const router = Router();

function buildTree(comments) {
  const byId = new Map(comments.map((c) => [c._id.toString(), { ...c, replies: [] }]));
  const roots = [];
  for (const c of byId.values()) {
    if (c.parentComment) {
      const parent = byId.get(c.parentComment.toString());
      if (parent) parent.replies.push(c);
      else roots.push(c);
    } else {
      roots.push(c);
    }
  }
  return roots;
}

router.get('/post/:postId', async (req, res, next) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email')
      .lean();
    res.json({ comments: buildTree(comments) });
  } catch (err) {
    next(err);
  }
});

router.post('/', requireAuth, commentRateLimiter, validateBody(createCommentSchema), async (req, res, next) => {
  try {
    const { post, content, parentComment } = req.body;
    if (parentComment) {
      const parent = await Comment.findById(parentComment);
      if (!parent) throw new ApiError(400, 'Parent comment not found');
    }
    const comment = await Comment.create({ post, content, parentComment, author: req.user.id });
    await comment.populate('author', 'name email');
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

router.put('/:id', requireAuth, validateBody(updateCommentSchema), async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    if (comment.author.toString() !== req.user.id) throw new ApiError(403, 'Not the comment owner');
    comment.content = req.body.content;
    await comment.save();
    res.json({ comment });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    if (comment.author.toString() !== req.user.id) throw new ApiError(403, 'Not the comment owner');
    await comment.deleteOne();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

// Like toggle - authenticated users can like/unlike once each.
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) throw new ApiError(404, 'Comment not found');
    const idx = comment.likedBy.findIndex((u) => u.toString() === req.user.id);
    if (idx >= 0) {
      comment.likedBy.splice(idx, 1);
      comment.likeCount = Math.max(0, comment.likeCount - 1);
    } else {
      comment.likedBy.push(req.user.id);
      comment.likeCount += 1;
    }
    await comment.save();
    res.json({ likeCount: comment.likeCount, liked: idx < 0 });
  } catch (err) {
    next(err);
  }
});

export default router;
