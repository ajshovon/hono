# Hono test api with bun

To install dependencies:

```sh
bun install
```

To run:

```sh

cp .env.example .env

bunx prisma migrate dev --name init

bun run dev
```

open <http://localhost:3000/api>
