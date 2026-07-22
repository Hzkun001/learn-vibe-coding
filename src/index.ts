import { Elysia, t } from 'elysia';
import { db } from './db';
import { users } from './db/schema';
import { asc } from 'drizzle-orm';

const app = new Elysia()
  .get('/', () => 'Hello Elysia!')
  .get(
    '/users',
    async ({ query, set }) => {
      const limit = Math.min(Number(query.limit ?? 10), 100);
      const offset = Number(query.offset ?? 0);

      try {
        const allUsers = await db
          .select({
            id: users.id,
            name: users.name,
            email: users.email,
          })
          .from(users)
          .orderBy(asc(users.id))
          .limit(limit)
          .offset(offset);

        return allUsers;
      } catch (error) {
        console.error(error);
        set.status = 500;
        return { error: 'Database error. Make sure migrations are run.' };
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric()),
        offset: t.Optional(t.Numeric()),
      }),
    }
  )
  .post(
    '/users',
    async ({ body, set }) => {
      const { name, email } = body;
      try {
        await db.insert(users).values({ name, email });
        set.status = 201;
        return { success: true };
      } catch (error: any) {
        console.error(error);
        if (error.code === 'ER_DUP_ENTRY') {
          set.status = 409;
          return { error: 'Email already exists.' };
        }
        set.status = 500;
        return { error: 'Failed to insert user.' };
      }
    },
    {
      body: t.Object({
        name: t.String({ minLength: 1 }),
        email: t.String({ format: 'email' }),
      }),
    }
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
