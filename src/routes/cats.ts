import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import prisma from '../clients/prisma';

const cats = new Hono();

// Zod schemas with strict mode
const CatCreateSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    age: z.number().positive('Age must be a positive number'),
  })
  .strict();

const CatUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    age: z.number().positive().optional(),
  })
  .strict();

// Schema to validate id
const IdSchema = z.string().refine(
  (val) => {
    const parsedId = parseInt(val, 10);
    return !isNaN(parsedId) && parsedId > 0;
  },
  {
    message: 'ID must be a positive integer',
  }
);

// Helpers
const findOne = async (id: number) => {
  const cat = await prisma.cat.findUnique({
    where: { id },
  });
  return cat;
};

// Get All Cats
cats.get('/', async (c) => {
  const allCats = await prisma.cat.findMany({ select: { id: true, name: true, age: true } });
  return c.json({ status: 'ok', cats: allCats });
});

// Get a single cat
cats.get('/:id', zValidator('param', z.object({ id: IdSchema })), async (c) => {
  const { id } = c.req.valid('param');
  const parsedId = parseInt(id, 10);
  const cat = await findOne(parsedId);
  if (!cat) return c.notFound();
  return c.json({ status: 'ok', data: cat });
});

// Create a cat
cats.post('/', zValidator('json', CatCreateSchema), async (c) => {
  const { name, age } = c.req.valid('json');
  const cat = await prisma.cat.create({
    data: { name, age },
  });
  return c.json({ status: 'ok', data: cat }, 201);
});

// Delete a cat
cats.delete('/:id', zValidator('param', z.object({ id: IdSchema })), async (c) => {
  const { id } = c.req.valid('param');
  const parsedId = parseInt(id, 10);
  const cat = await findOne(parsedId);
  if (!cat) return c.notFound();

  await prisma.cat.delete({
    where: { id: parsedId },
  });
  return c.json({}, 204);
});

// Update a cat
cats.patch('/:id', zValidator('param', z.object({ id: IdSchema })), zValidator('json', CatUpdateSchema), async (c) => {
  const { id } = c.req.valid('param');
  const parsedId = parseInt(id, 10);
  const cat = await findOne(parsedId);
  if (!cat) return c.notFound();

  const { name, age } = c.req.valid('json');
  const updatedCat = await prisma.cat.update({
    where: { id: parsedId },
    data: { name, age },
  });
  return c.json({ status: 'ok', data: updatedCat }, 201);
});

export default cats;
