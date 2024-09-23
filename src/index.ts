import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { createFactory } from 'hono/factory';
import { jwt, JwtVariables } from 'hono/jwt';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { DEFAULT_EMAIL, DEFAULT_PASS, JWT_SECRET } from './clients/env';
import prisma from './clients/prisma';
import auth from './routes/auth';
import cats from './routes/cats';

type Variables = JwtVariables;

const factory = createFactory<{ Variables: Variables }>({
  initApp: async () => {
    // Create a default user
    console.log('Application is bootstrapping...');
    console.log('Checking for user accounts...');
    const users = await prisma.user.findMany();
    if (!users.length) {
      console.log('No users found. Initializing default user...');
      const hash = await Bun.password.hash(DEFAULT_PASS);
      await prisma.user.create({
        data: {
          email: DEFAULT_EMAIL,
          name: 'ADMIN',
          hash,
        },
      });
      console.log('Successfully initialized  default user.');
    } else {
      console.log('Users found. Not initializing any user.');
    }
    console.log('Application is ready to accept connection.');
  },
});

// Create the Hono app
const app = factory.createApp().basePath('/api');
app.use(logger());
app.use(secureHeaders());
app.use('/*', cors());
app.use(csrf({ origin: 'example.com' }));

// JWT Middleware
app.use('/private/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: JWT_SECRET as string,
  });
  return jwtMiddleware(c, next);
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

// Cats Route
app.route('/cats', cats);

// Auth Route
app.route('/auth/jwt', auth);

// Protected Route
app.get('/private', (c) => {
  return c.text('You are authorized');
});

export default app;
