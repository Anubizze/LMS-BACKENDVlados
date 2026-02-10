import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from 'src';
import { lessonsTable, coursesTable } from 'src/db/schema';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonService {
  private async ensureAuthor(userId: number, courseId: number) {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) throw new NotFoundException('Курс не найден');
    if (course.userId !== userId) throw new ForbiddenException('Вы не автор этого курса');
    return course;
  }

  private async ensureAuthorByLesson(userId: number, lessonId: number) {
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, lessonId)).limit(1);
    if (!lesson) throw new NotFoundException('Урок не найден');
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, lesson.courseId)).limit(1);
    if (!course || course.userId !== userId) throw new ForbiddenException('Вы не автор этого курса');
    return { lesson, course };
  }

  async create(userId: number, courseId: number, dto: CreateLessonDto) {
    await this.ensureAuthor(userId, courseId);

    const [lesson] = await db
      .insert(lessonsTable)
      .values({
        courseId,
        title: dto.title,
        description: dto.description,
        duration: dto.duration ?? 0,
        order: dto.order ?? 0,
        type: dto.type ?? 'theory',
      })
      .returning();

    return { message: 'Урок создан', lesson };
  }

  async findById(id: number) {
    const [lesson] = await db.select().from(lessonsTable).where(eq(lessonsTable.id, id)).limit(1);
    if (!lesson) throw new NotFoundException('Урок не найден');
    return lesson;
  }

  async update(userId: number, lessonId: number, dto: UpdateLessonDto) {
    const { lesson } = await this.ensureAuthorByLesson(userId, lessonId);

    const updates: Partial<{
      title: string;
      description: string | null;
      duration: number;
      order: number;
      type: string;
    }> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.duration !== undefined) updates.duration = dto.duration;
    if (dto.order !== undefined) updates.order = dto.order;
    if (dto.type !== undefined) updates.type = dto.type;

    if (Object.keys(updates).length === 0) return lesson;

    const [updated] = await db
      .update(lessonsTable)
      .set(updates)
      .where(eq(lessonsTable.id, lessonId))
      .returning();

    return updated;
  }

  async delete(userId: number, lessonId: number) {
    await this.ensureAuthorByLesson(userId, lessonId);
    await db.delete(lessonsTable).where(eq(lessonsTable.id, lessonId));
    return { message: 'Урок удалён' };
  }
}
