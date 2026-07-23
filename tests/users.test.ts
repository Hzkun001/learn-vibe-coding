import { describe, it, expect, beforeEach } from 'bun:test';
import {
  registerUser,
  loginUser,
} from '../src/services/users-service';
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';
import { usersRoute } from '../src/routes/users-route';

describe('User APIs Comprehensive Test Suite', () => {
  beforeEach(async () => {
    // Clean up database tables before each test scenario to ensure isolation & consistency
    await db.delete(sessions);
    await db.delete(users);
  });

  describe('POST /api/users (User Registration)', () => {
    it('should successfully register a new user', async () => {
      const req = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hafidz',
          email: 'hafidz@gmail.com',
          password: 'rahasiaPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(201);

      const body = await res.json();
      expect(body).toEqual({ data: 'Ok' });
    });

    it('should fail when registering duplicate email', async () => {
      // First registration
      await registerUser({
        name: 'Hafidz',
        email: 'hafidz@gmail.com',
        password: 'rahasiaPassword',
      });

      // Second registration with same email
      const req = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hafidz Duplicate',
          email: 'hafidz@gmail.com',
          password: 'anotherPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toEqual({ error: 'email sudah terdaftar' });
    });

    it('should fail schema validation when name/email/password are missing', async () => {
      const req = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(422);
    });

    it('should fail schema validation when name exceeds 255 characters', async () => {
      const req = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'a'.repeat(256),
          email: 'valid@gmail.com',
          password: 'rahasiaPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(422);
    });

    it('should fail schema validation for invalid email format', async () => {
      const req = new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Hafidz',
          email: 'invalid-email-format',
          password: 'rahasiaPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe('POST /api/users/login (User Login)', () => {
    beforeEach(async () => {
      // Register default user for login tests
      await registerUser({
        name: 'Hafidz User',
        email: 'hafidz@gmail.com',
        password: 'rahasiaPassword',
      });
    });

    it('should successfully log in with valid credentials and return token', async () => {
      const req = new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hafidz@gmail.com',
          password: 'rahasiaPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toHaveProperty('data');
      expect(typeof body.data).toBe('string');
      expect(body.data.length).toBeGreaterThan(0);
    });

    it('should fail when logging in with unregistered email', async () => {
      const req = new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'unregistered@gmail.com',
          password: 'rahasiaPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toEqual({ error: 'email atau password salah' });
    });

    it('should fail when logging in with wrong password', async () => {
      const req = new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hafidz@gmail.com',
          password: 'wrongPassword',
        }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body).toEqual({ error: 'email atau password salah' });
    });

    it('should fail schema validation for invalid login request', async () => {
      const req = new Request('http://localhost/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email' }),
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(422);
    });
  });

  describe('GET /api/users/current (Get Logged In User Profile)', () => {
    let token = '';

    beforeEach(async () => {
      await registerUser({
        name: 'Hafidz Current',
        email: 'current@gmail.com',
        password: 'rahasiaPassword',
      });
      const loginRes = await loginUser({
        email: 'current@gmail.com',
        password: 'rahasiaPassword',
      });
      token = (loginRes as { data: string }).data;
    });

    it('should successfully get user profile with valid Bearer token', async () => {
      const req = new Request('http://localhost/api/users/current', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.data.name).toBe('Hafidz Current');
      expect(body.data.email).toBe('current@gmail.com');
      expect(body.data.password).toBeUndefined();
    });

    it('should fail when Authorization header is missing', async () => {
      const req = new Request('http://localhost/api/users/current', {
        method: 'GET',
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });

    it('should fail when Authorization header does not use Bearer format', async () => {
      const req = new Request('http://localhost/api/users/current', {
        method: 'GET',
        headers: {
          Authorization: `Basic ${token}`,
        },
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });

    it('should fail when token is invalid or non-existent', async () => {
      const req = new Request('http://localhost/api/users/current', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token-uuid',
        },
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });
  });

  describe('DELETE /api/users/logout (User Logout)', () => {
    let token = '';

    beforeEach(async () => {
      await registerUser({
        name: 'Logout User',
        email: 'logout@gmail.com',
        password: 'rahasiaPassword',
      });
      const loginRes = await loginUser({
        email: 'logout@gmail.com',
        password: 'rahasiaPassword',
      });
      token = (loginRes as { data: string }).data;
    });

    it('should successfully log out user and invalidate session', async () => {
      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body).toEqual({ data: 'OK' });

      // Verify token cannot be used again
      const currentReq = new Request('http://localhost/api/users/current', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const currentRes = await usersRoute.handle(currentReq);
      expect(currentRes.status).toBe(401);
    });

    it('should fail when logging out without Authorization header', async () => {
      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });

    it('should fail when logging out with non-existent or already logged out token', async () => {
      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
        headers: {
          Authorization: 'Bearer non-existent-token',
        },
      });

      const res = await usersRoute.handle(req);
      expect(res.status).toBe(401);

      const body = await res.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });
  });
});
