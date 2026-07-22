import { Elysia } from 'elysia';
import { db } from './db';
import { users } from './db/schema';

const app = new Elysia()
  .get('/', () => 'Hello Elysia!')
  .get('/users', async () => {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error(error);
      return { error: 'Database error. Make sure migrations are run.' };
    }
  })
  .post('/users', async ({ body }) => {
    const { name, email } = body as { name: string; email: string };
    try {
      await db.insert(users).values({ name, email });
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: 'Failed to insert user.' };
    }
  })
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
