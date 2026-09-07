import { Router } from 'express';
import Post from '../models/Post.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const tags = await Post.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, tag: '$_id', count: 1 } },
    ]);
    res.json({ tags });
  } catch (err) {
    next(err);
  }
});

export default router;
