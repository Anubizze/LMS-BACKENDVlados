import { Injectable } from '@nestjs/common';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { db } from 'src';
import { coursesTable, enrollmentsTable } from 'src/db/schema';

@Injectable()
export class AnalyticsService {
  async getForTeacher(userId: number) {
    const teacherCourses = await db
      .select({ id: coursesTable.id, title: coursesTable.title, studentsCount: coursesTable.studentsCount, reviewsCount: coursesTable.reviewsCount, rating: coursesTable.rating, price: coursesTable.price })
      .from(coursesTable)
      .where(eq(coursesTable.userId, userId));

    const courseIds = teacherCourses.map((c) => c.id);
    if (courseIds.length === 0) {
      return {
        totalStudents: 0,
        newEnrollmentsWeek: 0,
        newEnrollmentsMonth: 0,
        averageRating: 0,
        topCourse: null,
        enrollmentsByDay: [] as { date: string; count: number }[],
        coursesTable: [],
      };
    }

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [enrollmentsAll, enrollmentsWeek, enrollmentsMonth] = await Promise.all([
      db.select().from(enrollmentsTable).where(inArray(enrollmentsTable.courseId, courseIds)),
      db.select().from(enrollmentsTable).where(and(inArray(enrollmentsTable.courseId, courseIds), gte(enrollmentsTable.enrolledAt, weekAgo))),
      db.select().from(enrollmentsTable).where(and(inArray(enrollmentsTable.courseId, courseIds), gte(enrollmentsTable.enrolledAt, monthAgo))),
    ]);

    const totalStudents = teacherCourses.reduce((sum, c) => sum + (c.studentsCount ?? 0), 0);
    const newEnrollmentsWeek = enrollmentsWeek.length;
    const newEnrollmentsMonth = enrollmentsMonth.length;

    let averageRating = 0;
    let totalReviews = 0;
    for (const c of teacherCourses) {
      const rev = c.reviewsCount ?? 0;
      totalReviews += rev;
      averageRating += (c.rating ?? 0) * rev;
    }
    if (totalReviews > 0) averageRating = Math.round((averageRating / totalReviews) * 10) / 10;

    const topCourse = teacherCourses.length
      ? teacherCourses.reduce((best, c) => ((c.studentsCount ?? 0) > (best?.studentsCount ?? 0) ? c : best), teacherCourses[0])
      : null;

    const byDay: Record<string, number> = {};
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    for (let d = new Date(day30Ago); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      byDay[key] = 0;
    }
    for (const e of enrollmentsAll) {
      const dateStr = new Date(e.enrolledAt).toISOString().slice(0, 10);
      if (dateStr >= day30Ago.toISOString().slice(0, 10)) byDay[dateStr] = (byDay[dateStr] ?? 0) + 1;
    }
    const enrollmentsByDay = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const coursesTableData = teacherCourses.map((c) => ({
      id: c.id,
      title: c.title,
      students: c.studentsCount ?? 0,
      reviews: c.reviewsCount ?? 0,
      rating: c.rating ?? 0,
      revenue: (c.price ?? 0) * (c.studentsCount ?? 0) * 0.7,
    }));

    return {
      totalStudents,
      newEnrollmentsWeek,
      newEnrollmentsMonth,
      averageRating,
      topCourse: topCourse ? { id: topCourse.id, title: topCourse.title, studentsCount: topCourse.studentsCount ?? 0 } : null,
      enrollmentsByDay,
      coursesTable: coursesTableData,
    };
  }
}
