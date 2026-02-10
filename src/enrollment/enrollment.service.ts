import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { db } from 'src';
import { enrollmentsTable, coursesTable, usersTable, categoryTable, lessonsTable } from 'src/db/schema';
import { asc } from 'drizzle-orm';

@Injectable()
export class EnrollmentService {
  async enroll(userId: number, courseId: number) {
    const [existing] = await db
      .select()
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
      .limit(1);

    if (existing) {
      throw new ConflictException('Вы уже записаны на этот курс');
    }

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) {
      throw new NotFoundException('Курс не найден');
    }

    const [enrollment] = await db
      .insert(enrollmentsTable)
      .values({ userId, courseId })
      .returning();

    await db
      .update(coursesTable)
      .set({ studentsCount: (course.studentsCount ?? 0) + 1 })
      .where(eq(coursesTable.id, courseId));

    return { message: 'Вы успешно записаны на курс', enrollment };
  }

  async getMyEnrollments(userId: number) {
    const enrollments = await db
      .select()
      .from(enrollmentsTable)
      .where(eq(enrollmentsTable.userId, userId))
      .orderBy(asc(enrollmentsTable.enrolledAt));

    const result = await Promise.all(
      enrollments.map(async (e) => {
        const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, e.courseId)).limit(1);
        if (!course) return null;
        const [author] = await db.select({ fullname: usersTable.fullname }).from(usersTable).where(eq(usersTable.id, course.userId)).limit(1);
        const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, course.categoryId)).limit(1);
        const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, course.id)).orderBy(asc(lessonsTable.order));
        const duration = lessons.reduce((sum, l) => sum + (l.duration ?? 0), 0);
        return {
          ...course,
          author: author?.fullname ?? 'Автор',
          category: category?.name ?? '',
          categorySlug: category?.slug ?? '',
          lessons,
          duration,
          currentPrice: course.price,
          enrollment: {
            progressPercent: e.progressPercent,
            enrolledAt: e.enrolledAt,
          },
        };
      })
    );

    return result.filter(Boolean);
  }

  async updateProgress(userId: number, courseId: number, progressPercent: number) {
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      throw new NotFoundException('Запись на курс не найдена');
    }

    const [updated] = await db
      .update(enrollmentsTable)
      .set({ progressPercent: Math.min(100, Math.max(0, progressPercent)) })
      .where(eq(enrollmentsTable.id, enrollment.id))
      .returning();

    return updated;
  }

  async checkEnrollment(userId: number, courseId: number) {
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(and(eq(enrollmentsTable.userId, userId), eq(enrollmentsTable.courseId, courseId)))
      .limit(1);
    return !!enrollment;
  }
}
