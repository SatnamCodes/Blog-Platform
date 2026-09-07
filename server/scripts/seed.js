/**
 * Local dev seed script. NOT run automatically - the app must work against
 * an empty database on first run/register. Invoke manually with `npm run seed`.
 */
import bcrypt from 'bcryptjs';
import { connectDb } from '../src/db.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';
import { generateUniqueSlug } from '../src/utils/slugify.js';
import { computeWordStats } from '../src/utils/content.js';

async function seed() {
  await connectDb();

  const passwordHash = await bcrypt.hash('password123', 10);
  const author = await User.findOneAndUpdate(
    { email: 'demo.author@example.com' },
    { email: 'demo.author@example.com', passwordHash, name: 'Demo Author', role: 'author' },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const samplePosts = [
    {
      title: 'Getting Started with the Blog Platform',
      content: '# Welcome\n\nThis is a **sample** post seeded for local development.\n\n## Features\n\n- Markdown rendering\n- Tags\n- Comments',
      excerpt: 'A quick tour of the seeded sample content.',
      tags: ['intro', 'markdown'],
      status: 'published',
    },
    {
      title: 'Draft Post Example',
      content: 'This draft has not been published yet.',
      excerpt: 'An unpublished draft example.',
      tags: ['draft'],
      status: 'draft',
    },
  ];

  for (const p of samplePosts) {
    const existing = await Post.findOne({ title: p.title, author: author._id });
    if (existing) continue;
    const slug = await generateUniqueSlug(p.title, Post);
    const { wordCount, readingTime } = computeWordStats(p.content);
    await Post.create({
      ...p,
      slug,
      author: author._id,
      wordCount,
      readingTime,
      publishedAt: p.status === 'published' ? new Date() : null,
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete. Login with demo.author@example.com / password123');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
