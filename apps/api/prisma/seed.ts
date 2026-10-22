import 'dotenv/config';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const demo = [
  { title: 'Утро в саду', price: 45000, technique: 'Холст, масло', w: 60, h: 80, status: 'PUBLISHED' },
  { title: 'Северное море', price: 62000, technique: 'Холст, масло', w: 70, h: 100, status: 'PUBLISHED' },
  { title: 'Городские крыши', price: 18000, technique: 'Бумага, акварель', w: 30, h: 40, status: 'RESERVED' },
  { title: 'Портрет незнакомки', price: 90000, technique: 'Холст, масло', w: 50, h: 70, status: 'SOLD' },
  { title: 'Эскиз осени', price: 9000, technique: 'Бумага, графит', w: 21, h: 30, status: 'DRAFT' },
] as const;

async function main() {
  const email = (process.env.SEED_OWNER_EMAIL ?? 'owner@asya.local').toLowerCase();
  const password = process.env.SEED_OWNER_PASSWORD ?? 'owner12345';

  const owner = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: 'Владелец',
      role: 'OWNER',
      passwordHash: await argon2.hash(password),
      authorProfile: { create: { slug: 'owner', displayName: 'Ася', bio: 'Художник' } },
    },
    include: { authorProfile: true },
  });

  if ((await prisma.artwork.count()) === 0) {
    for (const [i, a] of demo.entries()) {
      await prisma.artwork.create({
        data: {
          authorId: owner.authorProfile!.id,
          slug: `demo-${i + 1}`,
          title: a.title,
          description: `Демонстрационная работа «${a.title}».`,
          price: a.price,
          technique: a.technique,
          widthCm: a.w,
          heightCm: a.h,
          year: 2026,
          type: a.technique.startsWith('Бумага') ? 'GRAPHIC' : 'PAINTING',
          status: a.status,
        },
      });
    }
  }

  console.log(`Seed OK. Вход: ${email} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
