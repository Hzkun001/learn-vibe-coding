import { describe, it, expect, beforeAll } from 'bun:test';
import { registerUser, loginUser } from '../src/services/users-service';
import { db } from '../src/db';
import { users, sessions } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('User Authentication & Login Tests', () => {
  const testUser = {
    name: 'Test Login User',
    email: `login_test_${Date.now()}@example.com`,
    password: 'password123',
  };

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
});
