import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Post from '../src/models/Post.js';
import { generateUniqueSlug } from '../src/utils/slugify.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Post.deleteMany({});
});

describe('generateUniqueSlug', () => {
  it('appends -2, -3 on repeated collisions', async () => {
    const author = new mongoose.Types.ObjectId();
    const makePost = async (title, slug) =>
      Post.create({ title, slug, author, content: 'x', wordCount: 1, readingTime: 1 });

    const slug1 = await generateUniqueSlug('My Great Post', Post);
    expect(slug1).toBe('my-great-post');
    await makePost('My Great Post', slug1);

    const slug2 = await generateUniqueSlug('My Great Post', Post);
    expect(slug2).toBe('my-great-post-2');
    await makePost('My Great Post', slug2);

    const slug3 = await generateUniqueSlug('My Great Post', Post);
    expect(slug3).toBe('my-great-post-3');
  });

  it('excludes the current post id when editing', async () => {
    const author = new mongoose.Types.ObjectId();
    const post = await Post.create({
      title: 'Edit Me',
      slug: 'edit-me',
      author,
      content: 'x',
      wordCount: 1,
      readingTime: 1,
    });
    const slug = await generateUniqueSlug('Edit Me', Post, post._id);
    expect(slug).toBe('edit-me');
  });
});
