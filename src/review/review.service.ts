import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from 'src';
import {
  reviewsTable,
  coursesTable,
  usersTable,
} from 'src/db/schema';
import { asc } from 'drizzle-orm';

@Injectable()
export class ReviewService {
  async create(userId: number, courseId: number, rating: number, comment?: string) {
    const [existing] = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.courseId, courseId)))
      .limit(1);

    if (existing) {
      throw new ConflictException('Вы уже оставили отзыв на этот курс');
    }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    const [review] = await db
      .insert(reviewsTable)
      .values({ userId, courseId, rating, comment })
      .returning();

    await this.updateCourseRating(courseId);

    const [author] = await db.select({ fullname: usersTable.fullname }).from(usersTable).where(eq(usersTable.id, userId)).limit(1);

    return {
      message: 'Отзыв добавлен',
      review: {
        ...review,
        author: author?.fullname ?? 'Пользователь',
      },
    };
  }

  async getByCourse(courseId: number) {
    const reviews = await db
      .select()
      .from(reviewsTable)
      .where(eq(reviewsTable.courseId, courseId))
      .orderBy(asc(reviewsTable.createdAt));

    const result = await Promise.all(
      reviews.map(async (r) => {
        const [user] = await db.select({ fullname: usersTable.fullname }).from(usersTable).where(eq(usersTable.id, r.userId)).limit(1);
        return {
          ...r,
          author: user?.fullname ?? 'Пользователь',
        };
      }),
    );

    return result;
  }

  async getMyReview(userId: number, courseId: number) {
    const [review] = await db
      .select()
      .from(reviewsTable)
      .where(and(eq(reviewsTable.userId, userId), eq(reviewsTable.courseId, courseId)))
      .limit(1);
    return review ?? null;
  }

  private async updateCourseRating(courseId: number) {
    const reviews = await db.select({ rating: reviewsTable.rating }).from(reviewsTable).where(eq(reviewsTable.courseId, courseId));

    if (reviews.length === 0) {
      await db.update(coursesTable).set({ rating: 0, reviewsCount: 0 }).where(eq(coursesTable.id, courseId));
      return;
    }

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const roundedRating = Math.round(avgRating * 10) / 10;

    await db
      .update(coursesTable)
      .set({ rating: roundedRating, reviewsCount: reviews.length })
      .where(eq(coursesTable.id, courseId));
  }
}
