import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from 'src';
import {
  favoritesTable,
  coursesTable,
  usersTable,
  categoryTable,
  lessonsTable,
} from 'src/db/schema';
import { asc } from 'drizzle-orm';

@Injectable()
export class FavoriteService {
  async add(userId: number, courseId: number) {
    const [existing] = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.courseId, courseId)))
      .limit(1);

    if (existing) {
      throw new ConflictException('Курс уже в избранном');
    }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    const [favorite] = await db
      .insert(favoritesTable)
      .values({ userId, courseId })
      .returning();

    return { message: 'Курс добавлен в избранное', favorite };
  }

  async remove(userId: number, courseId: number) {
    const [existing] = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.courseId, courseId)))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Курс не найден в избранном');
    }

    await db.delete(favoritesTable).where(eq(favoritesTable.id, existing.id));
    return { message: 'Курс удалён из избранного' };
  }

  async getMyFavorites(userId: number) {
    const favorites = await db
      .select()
      .from(favoritesTable)
      .where(eq(favoritesTable.userId, userId));

    const result = await Promise.all(
      favorites.map(async (f) => {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, f.courseId)).limit(1);
        if (!course) return null;
        const [author] = await db
          .select({ fullname: usersTable.fullname })
          .from(usersTable)
          .where(eq(usersTable.id, course.userId))
          .limit(1);
        const [category] = await db
          .select()
          .from(categoryTable)
          .where(eq(categoryTable.id, course.categoryId))
          .limit(1);
        const lessons = await db
          .select()
          .from(lessonsTable)
          .where(eq(lessonsTable.courseId, course.id))
          .orderBy(asc(lessonsTable.order));
        const duration = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);
        return {
          ...course,
          author: author?.fullname ?? 'Автор',
          category: category?.name ?? '',
          categorySlug: category?.slug ?? '',
          lessons,
          duration,
          currentPrice: course.price,
        };
      }),
    );

    return result.filter(Boolean);
  }

  async check(userId: number, courseId: number) {
    const [favorite] = await db
      .select()
      .from(favoritesTable)
      .where(and(eq(favoritesTable.userId, userId), eq(favoritesTable.courseId, courseId)))
      .limit(1);
    return !!favorite;
  }
}
