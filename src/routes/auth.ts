import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { JWT_SECRET } from '../clients/env';
import prisma from '../clients/prisma';

const auth = new Hono();

// Helpers
const findOneByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user;
};

const UserLoginSchema = z
  .object({
    email: z.string().min(3, { message: 'This field has to be filled.' }).email('This is not a valid email.'),
    password: z.string().min(8, { message: 'Minimum 8 characters required.' }),
  })
  .strict();

// Login JWT
auth.post('/login', zValidator('json', UserLoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');
  const targetUser = await findOneByEmail(email);
  if (!targetUser) throw new HTTPException(404);
  const isMatch = await Bun.password.verify(password, targetUser?.hash);
  if (!isMatch) throw new HTTPException(401);
  const payload = {
    sub: email,
    exp: Math.floor(Date.now() / 1000) + 60 * 60, // Token expires in 60 minutes
  };
  const secret = JWT_SECRET;
  const token = await sign(payload, secret);
  return c.json({ status: 'Authorized', accessToken: token });
});

export default auth;
