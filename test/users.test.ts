import { describe, it, expect, beforeAll } from 'bun:test';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
} from '../src/services/users-service';
import { db } from '../src/db';
import { sessions } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { usersRoute } from '../src/routes/users-route';

describe('User Authentication & Login Tests', () => {
  const testUser = {
    name: 'Test Login User',
    email: `login_test_${Date.now()}@example.com`,
    password: 'password123',
  };
  let validToken = '';

  beforeAll(async () => {
    // Register user first
    const regResult = await registerUser(testUser);
    expect(regResult).toEqual({ data: 'Ok' });
  });

  it('should return error when logging in with unregistered email', async () => {
    const result = await loginUser({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect(result).toEqual({ error: 'email atau password salah' });
  });

  it('should return error when logging in with incorrect password', async () => {
    const result = await loginUser({
      email: testUser.email,
      password: 'wrongpassword',
    });
    expect(result).toEqual({ error: 'email atau password salah' });
  });

  it('should successfully log in and generate session token', async () => {
    const result = await loginUser({
      email: testUser.email,
      password: testUser.password,
    });

    expect('data' in result).toBe(true);
    if ('data' in result) {
      expect(typeof result.data).toBe('string');
      expect(result.data.length).toBeGreaterThan(0);
      validToken = result.data;

      // Verify token is saved in database sessions table
      const sessionInDb = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, result.data))
        .limit(1);

      expect(sessionInDb.length).toBe(1);
      expect(sessionInDb[0].token).toBe(result.data);
    }
  });

  describe('Get Current User Tests', () => {
    it('should return unauthorized error for empty token', async () => {
      const result = await getCurrentUser('');
      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('should return unauthorized error for invalid token', async () => {
      const result = await getCurrentUser('invalid-token-12345');
      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('should return current user profile for valid token', async () => {
      const result = await getCurrentUser(validToken);
      expect('data' in result).toBe(true);
      if ('data' in result) {
        expect(result.data.name).toBe(testUser.name);
        expect(result.data.email).toBe(testUser.email);
        expect('password' in result.data).toBe(false);
      }
    });
  });

  describe('User Logout Tests', () => {
    it('should return unauthorized error for empty token', async () => {
      const result = await logoutUser('');
      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('should return unauthorized error for invalid token', async () => {
      const result = await logoutUser('nonexistent-token-12345');
      expect(result).toEqual({ error: 'unauthorized' });
    });

    it('should successfully log out user and delete token from database', async () => {
      const result = await logoutUser(validToken);
      expect(result).toEqual({ data: 'OK' });

      // Verify token is deleted from sessions table
      const sessionInDb = await db
        .select()
        .from(sessions)
        .where(eq(sessions.token, validToken))
        .limit(1);

      expect(sessionInDb.length).toBe(0);

      // Verify subsequent getCurrentUser with old token returns unauthorized
      const currentUserResult = await getCurrentUser(validToken);
      expect(currentUserResult).toEqual({ error: 'unauthorized' });
    });

    it('ROUTE: should return 401 for missing authorization header', async () => {
      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
      });
      const response = await usersRoute.handle(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });

    it('ROUTE: should return 401 for invalid authorization header format', async () => {
      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
        headers: {
          Authorization: 'Basic invalid-format',
        },
      });
      const response = await usersRoute.handle(req);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'unauthorized' });
    });

    it('ROUTE: should return 200 and OK payload for valid token', async () => {
      // Create a fresh login for this route test
      const loginRes = await loginUser({
        email: testUser.email,
        password: testUser.password,
      });
      const routeToken = (loginRes as { data: string }).data;

      const req = new Request('http://localhost/api/users/logout', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${routeToken}`,
        },
      });
      const response = await usersRoute.handle(req);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ data: 'OK' });
    });
  });
});
