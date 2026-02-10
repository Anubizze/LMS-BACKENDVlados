import { Injectable, OnModuleInit } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { db } from 'src';
import { categoryTable } from 'src/db/schema';

const SEED_CATEGORIES = [
  { name: 'Программирование', slug: 'programming', icon: '💻' },
  { name: 'Дизайн', slug: 'design', icon: '🎨' },
  { name: 'Языки', slug: 'languages', icon: '🌍' },
  { name: 'Бизнес', slug: 'business', icon: '💼' },
  { name: 'Маркетинг', slug: 'marketing', icon: '📢' },
  { name: 'Веб-разработка', slug: 'web-dev', icon: '🌐' },
  { name: 'Data Science', slug: 'data-science', icon: '📊' },
  { name: 'Мобильная разработка', slug: 'mobile-dev', icon: '📱' },
  { name: 'Школьные предметы', slug: 'school', icon: '📚' },
];

@Injectable()
export class CategoryService implements OnModuleInit {
  async onModuleInit() {
    try {
      const existing = await db.select().from(categoryTable).limit(1);
      if (existing.length === 0) {
        await db.insert(categoryTable).values(SEED_CATEGORIES);
      }
    } catch (err) {
      console.error('[CategoryService] Не удалось подключиться к БД или выполнить seed. Запустите PostgreSQL и проверьте DATABASE_URL в .env:', err instanceof Error ? err.message : err);
    }
  }

  async findAll() {
    return db.select().from(categoryTable).orderBy(asc(categoryTable.name));
  }

  async findById(id: number) {
    const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, id)).limit(1);
    return category ?? null;
  }

  async findBySlug(slug: string) {
    const [category] = await db.select().from(categoryTable).where(eq(categoryTable.slug, slug)).limit(1);
    return category ?? null;
  }
}
