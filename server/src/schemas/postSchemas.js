import { z } from 'zod';

export const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  excerpt: z.string().max(500).optional().default(''),
  tags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  coverImage: z.string().url().optional().or(z.literal('')).default(''),
});

export const updatePostSchema = createPostSchema.partial();

export const listPostsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  tag: z.string().optional(),
  search: z.string().optional(),
});
