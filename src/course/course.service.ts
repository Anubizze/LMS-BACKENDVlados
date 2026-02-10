import { ForbiddenException, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { asc, eq, and } from 'drizzle-orm';
import { db } from 'src';
import { coursesTable, lessonsTable, usersTable, categoryTable } from 'src/db/schema';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CourseService implements OnModuleInit {
  async onModuleInit() {
    const existing = await db.select().from(coursesTable).limit(1);
    if (existing.length === 0) {
      const [firstUser] = await db.select().from(usersTable).limit(1);
      const categories = await db.select().from(categoryTable);
      if (firstUser && categories.length > 0) {
        const catIds = categories.reduce((acc, c) => {
          acc[c.slug] = c.id;
          return acc;
        }, {} as Record<string, number>);

        const seedCourses = [
          {
            userId: firstUser.id,
            categoryId: catIds['languages'] ?? categories[0].id,
            title: 'Активный Английский: курс для начинающих',
            description: 'Полный курс английского языка для начинающих.',
            fullDescription: 'Этот курс разработан специально для начинающих.',
            level: 'beginner',
            language: 'Русский',
            price: 1175,
            oldPrice: 1875,
            rating: 4.9,
            reviewsCount: 1247,
            studentsCount: 15200,
            image: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800&q=80',
            whatYouWillLearn: ['Грамматика', 'Лексика', 'Разговорная речь'],
            requirements: ['Желание учиться', '15-20 мин в день'],
          },
          {
            userId: firstUser.id,
            categoryId: catIds['programming'] ?? categories[0].id,
            title: 'Python для начинающих',
            description: 'Комплексный курс по Python.',
            fullDescription: 'Изучите Python от основ до проектов.',
            level: 'beginner',
            language: 'Русский',
            price: 4900,
            oldPrice: 7900,
            rating: 5.0,
            reviewsCount: 856,
            studentsCount: 8500,
            image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
            whatYouWillLearn: ['Синтаксис Python', 'Функции', 'ООП'],
            requirements: ['Базовые навыки ПК', 'Python 3.x'],
          },
        ];

        for (const course of seedCourses) {
          const [inserted] = await db.insert(coursesTable).values(course).returning();
          if (inserted) {
            await db.insert(lessonsTable).values([
              { courseId: inserted.id, title: 'Введение', duration: 20, order: 1, type: 'theory' },
              { courseId: inserted.id, title: 'Основы', duration: 45, order: 2, type: 'practice' },
            ]);
          }
        }
      }
    }
  }

  async findAll(filters?: { categoryId?: number; level?: string }) {
    const conditions = [eq(coursesTable.status, 'publish')];
    if (filters?.categoryId) conditions.push(eq(coursesTable.categoryId, filters.categoryId));
    if (filters?.level) conditions.push(eq(coursesTable.level, filters.level));

    const result = await db
      .select()
      .from(coursesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(coursesTable.createdAt));

    return Promise.all(
      result.map(async (course) => {
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
        };
      })
    );
  }

  async findById(id: number) {
    const courseId = typeof id === 'string' ? parseInt(id, 10) : id;
    if (Number.isNaN(courseId)) return null;

    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) return null;

    const [author] = await db.select({ fullname: usersTable.fullname }).from(usersTable).where(eq(usersTable.id, course.userId)).limit(1);
    const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, course.categoryId)).limit(1);
    const lessons = await db.select().from(lessonsTable).where(eq(lessonsTable.courseId, courseId)).orderBy(asc(lessonsTable.order));

    const duration = lessons.reduce((sum, l) => sum + Number(l.duration ?? 0), 0);
    return {
      ...course,
      author: author?.fullname ?? 'Автор',
      authorId: course.userId,
      category: category?.name ?? '',
      categoryId: course.categoryId,
      categorySlug: category?.slug ?? '',
      lessons,
      duration: Number(duration),
      currentPrice: course.price,
    };
  }

  async findByCategory(categoryId: number) {
    return this.findAll({ categoryId });
  }

  async findMyCourses(userId: number) {
    const result = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.userId, userId))
      .orderBy(asc(coursesTable.createdAt));

    return Promise.all(
      result.map(async (course) => {
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
        };
      })
    );
  }

  private async ensureAuthor(userId: number, courseId: number, userRole?: string) {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, courseId)).limit(1);
    if (!course) throw new NotFoundException('Курс не найден');
    if (course.userId !== userId && userRole !== 'admin') {
      throw new ForbiddenException('Вы не автор этого курса');
    }
    return course;
  }

  async create(userId: number, dto: CreateCourseDto) {
    const [category] = await db.select().from(categoryTable).where(eq(categoryTable.id, dto.categoryId)).limit(1);
    if (!category) throw new NotFoundException('Категория не найдена');

    const [course] = await db
      .insert(coursesTable)
      .values({
        userId,
        categoryId: dto.categoryId,
        title: dto.title,
        description: dto.description ?? null,
        fullDescription: dto.fullDescription ?? null,
        level: dto.level ?? 'beginner',
        language: dto.language ?? 'Русский',
        price: dto.price ?? 0,
        oldPrice: dto.oldPrice ?? null,
        image: dto.image ?? null,
        whatYouWillLearn: dto.whatYouWillLearn ?? null,
        requirements: dto.requirements ?? null,
        status: (dto.status as 'draft' | 'publish' | 'archived') ?? 'draft',
      })
      .returning();

    const full = await this.findById(course.id);
    return { message: 'Курс создан', course: full };
  }

  async update(userId: number, courseId: number, dto: UpdateCourseDto, userRole?: string) {
    await this.ensureAuthor(userId, courseId, userRole);

    if (dto.categoryId !== undefined) {
      const [cat] = await db.select().from(categoryTable).where(eq(categoryTable.id, dto.categoryId)).limit(1);
      if (!cat) throw new NotFoundException('Категория не найдена');
    }

    const updates: Record<string, unknown> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId;
    if (dto.description !== undefined) updates.description = dto.description;
    if (dto.fullDescription !== undefined) updates.fullDescription = dto.fullDescription;
    if (dto.level !== undefined) updates.level = dto.level;
    if (dto.language !== undefined) updates.language = dto.language;
    if (dto.price !== undefined) updates.price = dto.price;
    if (dto.oldPrice !== undefined) updates.oldPrice = dto.oldPrice;
    if (dto.image !== undefined) updates.image = dto.image;
    if (dto.whatYouWillLearn !== undefined) updates.whatYouWillLearn = dto.whatYouWillLearn;
    if (dto.requirements !== undefined) updates.requirements = dto.requirements;
    if (dto.status !== undefined) updates.status = dto.status;
    updates.updatedAt = new Date();

    if (Object.keys(updates).length <= 1) {
      const c = await this.findById(courseId);
      if (!c) throw new NotFoundException('Курс не найден');
      return c;
    }

    await db.update(coursesTable).set(updates).where(eq(coursesTable.id, courseId));
    const updated = await this.findById(courseId);
    if (!updated) throw new NotFoundException('Курс не найден');
    return updated;
  }

  async archive(userId: number, courseId: number, userRole?: string) {
    await this.ensureAuthor(userId, courseId, userRole);
    await db
      .update(coursesTable)
      .set({ status: 'archived', updatedAt: new Date() })
      .where(eq(coursesTable.id, courseId));
    return { message: 'Курс архивирован' };
  }

  async remove(userId: number, courseId: number, userRole?: string) {
    await this.ensureAuthor(userId, courseId, userRole);
    await db.delete(coursesTable).where(eq(coursesTable.id, courseId));
    return { message: 'Курс удалён' };
  }
}
