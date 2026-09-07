import { z } from 'zod';
import mongoose from 'mongoose';

const objectId = z.string().refine((v) => mongoose.Types.ObjectId.isValid(v), 'Invalid id');

export const createCommentSchema = z.object({
  post: objectId,
  content: z.string().min(1).max(2000),
  parentComment: objectId.nullable().optional().default(null),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});
