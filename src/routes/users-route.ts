import { Elysia, t } from 'elysia';
import {
  registerUser,
  loginUser,
  getCurrentUser,
} from '../services/users-service';

export const usersRoute = new Elysia()
  .post(
    '/api/users',
    async ({ body, set }) => {
      const result = await registerUser(body);

      if ('error' in result) {
        set.status = 400;
        return { error: result.error };
      }

      set.status = 201;
      return { data: result.data };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .post(
    '/api/users/login',
    async ({ body, set }) => {
      const result = await loginUser(body);

      if ('error' in result) {
        set.status = 400;
        return { error: result.error };
      }

      set.status = 200;
      return { data: result.data };
    },
    {
      body: t.Object({
        email: t.String({ format: 'email' }),
        password: t.String({ minLength: 1 }),
      }),
    }
  )
  .get('/api/users/current', async ({ headers, set }) => {
    const authHeader = headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      set.status = 401;
      return { error: 'unauthorized' };
    }

    const token = authHeader.substring(7).trim();
    const result = await getCurrentUser(token);

    if ('error' in result) {
      set.status = 401;
      return { error: result.error };
    }

    set.status = 200;
    return { data: result.data };
  });
