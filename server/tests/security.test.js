import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { createApp } from '../src/app.js';
import User from '../src/models/User.js';
import Post from '../src/models/Post.js';

let mongod;
let app;
let accessToken;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = createApp();

  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await User.create({
    email: 'xss-test@example.com',
    passwordHash,
    name: 'XSS Tester',
    role: 'author',
  });

  const res = await request(app).post('/api/auth/login').send({
    email: 'xss-test@example.com',
    password: 'password123',
  });
  accessToken = res.body.accessToken;
  void user;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('server-side sanitization', () => {
  it('strips a <script> tag from post content before it is stored', async () => {
    const res = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'XSS Attempt Post',
        content: 'Hello <script>alert(1)</script> world',
        status: 'draft',
      });

    expect(res.status).toBe(201);
    expect(res.body.post.content).not.toContain('<script>');
    expect(res.body.post.content).not.toContain('alert(1)');

    const stored = await Post.findById(res.body.post._id).lean();
    expect(stored.content).not.toContain('<script>');
  });
});
