import { Elysia, t } from 'elysia';
import {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
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
        name: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ['Eko Kurniawan'],
        }),
        email: t.String({
          format: 'email',
          maxLength: 255,
          examples: ['eko@example.com'],
        }),
        password: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ['rahasia123'],
        }),
      }),
      response: {
        201: t.Object({
          data: t.String({ examples: ['Ok'] }),
        }),
        400: t.Object({
          error: t.String({ examples: ['email sudah terdaftar'] }),
        }),
        422: t.Object({
          message: t.String({ examples: ['Validation error'] }),
        }),
      },
      detail: {
        summary: 'Register User Baru',
        description: 'Mendaftarkan akun pengguna baru ke sistem.',
      },
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
        email: t.String({
          format: 'email',
          maxLength: 255,
          examples: ['eko@example.com'],
        }),
        password: t.String({
          minLength: 1,
          maxLength: 255,
          examples: ['rahasia123'],
        }),
      }),
      response: {
        200: t.Object({
          data: t.String({
            examples: ['9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'],
          }),
        }),
        400: t.Object({
          error: t.String({ examples: ['email atau password salah'] }),
        }),
        422: t.Object({
          message: t.String({ examples: ['Validation error'] }),
        }),
      },
      detail: {
        summary: 'User Login',
        description: 'Melakukan login dan mengembalikan token sesi (UUID).',
      },
    }
  )
  .get(
    '/api/users/current',
    async ({ headers, set }) => {
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
    },
    {
      response: {
        200: t.Object({
          data: t.Object({
            id: t.Number({ examples: [1] }),
            name: t.String({ examples: ['Eko Kurniawan'] }),
            email: t.String({ examples: ['eko@example.com'] }),
            createdAt: t.Nullable(
              t.Union([t.Date(), t.String()], {
                examples: ['2026-07-23T10:00:00.000Z'],
              })
            ),
          }),
        }),
        401: t.Object({
          error: t.String({ examples: ['unauthorized'] }),
        }),
      },
      detail: {
        summary: 'Get Profile User Logged In',
        description:
          'Mendapatkan profil pengguna yang sedang login berdasarkan Bearer token.',
      },
    }
  )
  .delete(
    '/api/users/logout',
    async ({ headers, set }) => {
      const authHeader = headers['authorization'];

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        set.status = 401;
        return { error: 'unauthorized' };
      }

      const token = authHeader.substring(7).trim();
      const result = await logoutUser(token);

      if ('error' in result) {
        set.status = 401;
        return { error: result.error };
      }

      set.status = 200;
      return { data: result.data };
    },
    {
      response: {
        200: t.Object({
          data: t.String({ examples: ['OK'] }),
        }),
        401: t.Object({
          error: t.String({ examples: ['unauthorized'] }),
        }),
      },
      detail: {
        summary: 'User Logout',
        description:
          'Mengakhiri sesi login pengguna dan menghapus token dari database.',
      },
    }
  );
