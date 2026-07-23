import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { usersRoute } from './routes/users-route';

const app = new Elysia()
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Belajar Vibe Coding API',
          version: '1.0.0',
          description: 'Dokumentasi interaktif API Manajemen Pengguna (Belajar Vibe Coding)',
        },
      },
    })
  )
  .get('/', () => 'Hello Elysia!')
  .use(usersRoute)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
