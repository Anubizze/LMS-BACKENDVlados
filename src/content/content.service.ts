import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, inArray, asc } from 'drizzle-orm';
import { db } from 'src';
import {
  coursesTable,
  enrollmentsTable,
  lessonsTable,
  modulesTable,
  underModulesTable,
  modulesContentTable,
  underModuleCompletionsTable,
} from '../db/schema';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';
import { CreateUnderModuleDto } from './dto/create-under-module.dto';
import { UpdateUnderModuleDto } from './dto/update-under-module.dto';
import { CreateModulesContentDto } from './dto/create-modules-content.dto';
import { UpdateModulesContentDto } from './dto/update-modules-content.dto';

@Injectable()
export class ContentService {
  private async ensureAuthorByLesson(userId: number, lessonId: number) {
    const [lesson] = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Урок не найден');
    const [course] = await db
      .select()
      .from(coursesTable)
      .where(eq(coursesTable.id, lesson.courseId))
      .limit(1);
    if (!course || course.userId !== userId)
      throw new ForbiddenException('Вы не автор этого курса');
    return { lesson, course };
  }

  private async ensureAuthorByModule(userId: number, moduleId: number) {
    const [mod] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, moduleId))
      .limit(1);
    if (!mod) throw new NotFoundException('Модуль не найден');
    return this.ensureAuthorByLesson(userId, mod.lessonId);
  }

  private async ensureAuthorByUnderModule(userId: number, underModuleId: number) {
    const [um] = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.id, underModuleId))
      .limit(1);
    if (!um) throw new NotFoundException('Подмодуль не найден');
    return this.ensureAuthorByModule(userId, um.moduleId);
  }

  private async ensureAuthorByContent(userId: number, contentId: number) {
    const [c] = await db
      .select()
      .from(modulesContentTable)
      .where(eq(modulesContentTable.id, contentId))
      .limit(1);
    if (!c) throw new NotFoundException('Контент не найден');
    return this.ensureAuthorByUnderModule(userId, c.underModuleId);
  }

  private async getCourseIdByUnderModuleId(underModuleId: number): Promise<number> {
    const [um] = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.id, underModuleId))
      .limit(1);
    if (!um) throw new NotFoundException('Подмодуль не найден');
    const [mod] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, um.moduleId))
      .limit(1);
    if (!mod) throw new NotFoundException('Модуль не найден');
    const [lesson] = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, mod.lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Урок не найден');
    return lesson.courseId;
  }

  private async recalcProgress(userId: number, courseId: number) {
    const lessons = await db
      .select({ id: lessonsTable.id })
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, courseId));
    const lessonIds = lessons.map((l) => l.id);
    if (lessonIds.length === 0) {
      await db
        .update(enrollmentsTable)
        .set({ progressPercent: 0 })
        .where(
          and(
            eq(enrollmentsTable.userId, userId),
            eq(enrollmentsTable.courseId, courseId),
          ),
        );
      return 0;
    }
    const modules = await db
      .select({ id: modulesTable.id })
      .from(modulesTable)
      .where(inArray(modulesTable.lessonId, lessonIds));
    const moduleIds = modules.map((m) => m.id);
    if (moduleIds.length === 0) {
      await db
        .update(enrollmentsTable)
        .set({ progressPercent: 100 })
        .where(
          and(
            eq(enrollmentsTable.userId, userId),
            eq(enrollmentsTable.courseId, courseId),
          ),
        );
      return 100;
    }
    const underModules = await db
      .select({ id: underModulesTable.id })
      .from(underModulesTable)
      .where(inArray(underModulesTable.moduleId, moduleIds));
    const total = underModules.length;
    if (total === 0) {
      await db
        .update(enrollmentsTable)
        .set({ progressPercent: 100 })
        .where(
          and(
            eq(enrollmentsTable.userId, userId),
            eq(enrollmentsTable.courseId, courseId),
          ),
        );
      return 100;
    }
    const underModuleIds = underModules.map((u) => u.id);
    const completed = await db
      .select()
      .from(underModuleCompletionsTable)
      .where(
        and(
          eq(underModuleCompletionsTable.userId, userId),
          inArray(underModuleCompletionsTable.underModuleId, underModuleIds),
        ),
      );
    const percent = Math.min(100, Math.round((completed.length / total) * 100));
    await db
      .update(enrollmentsTable)
      .set({ progressPercent: percent })
      .where(
        and(
          eq(enrollmentsTable.userId, userId),
          eq(enrollmentsTable.courseId, courseId),
        ),
      );
    return percent;
  }

  // ——— Modules (преподаватель) ———
  async listModules(lessonId: number) {
    const [lesson] = await db
      .select()
      .from(lessonsTable)
      .where(eq(lessonsTable.id, lessonId))
      .limit(1);
    if (!lesson) throw new NotFoundException('Урок не найден');
    const rows = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.lessonId, lessonId))
      .orderBy(asc(modulesTable.order), asc(modulesTable.id));
    return rows;
  }

  async createModule(userId: number, lessonId: number, dto: CreateModuleDto) {
    await this.ensureAuthorByLesson(userId, lessonId);
    const [row] = await db
      .insert(modulesTable)
      .values({
        lessonId,
        title: dto.title,
        order: dto.order ?? 0,
      })
      .returning();
    return row;
  }

  async getModule(id: number) {
    const [row] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Модуль не найден');
    return row;
  }

  async updateModule(userId: number, id: number, dto: UpdateModuleDto) {
    await this.ensureAuthorByModule(userId, id);
    const updates: { title?: string; order?: number } = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.order !== undefined) updates.order = dto.order;
    if (Object.keys(updates).length === 0) return this.getModule(id);
    const [row] = await db
      .update(modulesTable)
      .set(updates)
      .where(eq(modulesTable.id, id))
      .returning();
    return row;
  }

  async deleteModule(userId: number, id: number) {
    await this.ensureAuthorByModule(userId, id);
    await db.delete(modulesTable).where(eq(modulesTable.id, id));
    return { message: 'Модуль удалён' };
  }

  // ——— Under-modules (преподаватель) ———
  async listUnderModules(moduleId: number) {
    const [mod] = await db
      .select()
      .from(modulesTable)
      .where(eq(modulesTable.id, moduleId))
      .limit(1);
    if (!mod) throw new NotFoundException('Модуль не найден');
    const rows = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.moduleId, moduleId))
      .orderBy(asc(underModulesTable.order), asc(underModulesTable.id));
    return rows;
  }

  async createUnderModule(
    userId: number,
    moduleId: number,
    dto: CreateUnderModuleDto,
  ) {
    await this.ensureAuthorByModule(userId, moduleId);
    const [row] = await db
      .insert(underModulesTable)
      .values({
        moduleId,
        title: dto.title,
        order: dto.order ?? 0,
        type: (dto.type as 'introduction' | 'theory' | 'video' | 'practice' | 'test') ?? 'theory',
        maxScore: dto.maxScore ?? 20,
      })
      .returning();
    return row;
  }

  async getUnderModule(id: number) {
    const [row] = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Подмодуль не найден');
    return row;
  }

  async updateUnderModule(
    userId: number,
    id: number,
    dto: UpdateUnderModuleDto,
  ) {
    await this.ensureAuthorByUnderModule(userId, id);
    type AssignmentType = 'introduction' | 'theory' | 'video' | 'practice' | 'test';
    const updates: Partial<{ title: string; order: number; type: AssignmentType; maxScore: number }> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.order !== undefined) updates.order = dto.order;
    if (dto.type !== undefined) updates.type = dto.type as AssignmentType;
    if (dto.maxScore !== undefined) updates.maxScore = dto.maxScore;
    if (Object.keys(updates).length === 0) return this.getUnderModule(id);
    const [row] = await db
      .update(underModulesTable)
      .set(updates)
      .where(eq(underModulesTable.id, id))
      .returning();
    return row;
  }

  async deleteUnderModule(userId: number, id: number) {
    await this.ensureAuthorByUnderModule(userId, id);
    await db.delete(underModulesTable).where(eq(underModulesTable.id, id));
    return { message: 'Подмодуль удалён' };
  }

  // ——— Modules content (преподаватель) ———
  async listContent(underModuleId: number) {
    const [um] = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.id, underModuleId))
      .limit(1);
    if (!um) throw new NotFoundException('Подмодуль не найден');
    const rows = await db
      .select()
      .from(modulesContentTable)
      .where(eq(modulesContentTable.underModuleId, underModuleId))
      .orderBy(asc(modulesContentTable.order), asc(modulesContentTable.id));
    return rows;
  }

  async createContent(
    userId: number,
    underModuleId: number,
    dto: CreateModulesContentDto,
  ) {
    await this.ensureAuthorByUnderModule(userId, underModuleId);
    const [row] = await db
      .insert(modulesContentTable)
      .values({
        underModuleId,
        title: dto.title,
        text: dto.text ?? null,
        video: dto.video ?? null,
        order: dto.order ?? 0,
      })
      .returning();
    return row;
  }

  async getContent(id: number) {
    const [row] = await db
      .select()
      .from(modulesContentTable)
      .where(eq(modulesContentTable.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Контент не найден');
    return row;
  }

  async updateContent(
    userId: number,
    id: number,
    dto: UpdateModulesContentDto,
  ) {
    await this.ensureAuthorByContent(userId, id);
    const updates: Partial<{
      title: string;
      text: string | null;
      video: string | null;
      order: number;
    }> = {};
    if (dto.title !== undefined) updates.title = dto.title;
    if (dto.text !== undefined) updates.text = dto.text;
    if (dto.video !== undefined) updates.video = dto.video;
    if (dto.order !== undefined) updates.order = dto.order;
    if (Object.keys(updates).length === 0) return this.getContent(id);
    const [row] = await db
      .update(modulesContentTable)
      .set(updates)
      .where(eq(modulesContentTable.id, id))
      .returning();
    return row;
  }

  async deleteContent(userId: number, id: number) {
    await this.ensureAuthorByContent(userId, id);
    await db.delete(modulesContentTable).where(eq(modulesContentTable.id, id));
    return { message: 'Контент удалён' };
  }

  // ——— Прохождение подмодуля + процент (студент) ———
  async markComplete(userId: number, underModuleId: number) {
    const courseId = await this.getCourseIdByUnderModuleId(underModuleId);
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.userId, userId),
          eq(enrollmentsTable.courseId, courseId),
        ),
      )
      .limit(1);
    if (!enrollment)
      throw new ForbiddenException('Вы не записаны на этот курс');
    await db
      .insert(underModuleCompletionsTable)
      .values({ userId, underModuleId, score: 0 })
      .onConflictDoNothing({
        target: [
          underModuleCompletionsTable.userId,
          underModuleCompletionsTable.underModuleId,
        ],
      });
    const percent = await this.recalcProgress(userId, courseId);
    return { message: 'Подмодуль отмечен пройденным', progressPercent: percent };
  }

  /** Доступ: только если записан на курс и (первый в модуле по order ИЛИ предыдущий подмодуль в модуле пройден) */
  async canAccess(userId: number, underModuleId: number): Promise<boolean> {
    const [um] = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.id, underModuleId))
      .limit(1);
    if (!um) return false;
    const courseId = await this.getCourseIdByUnderModuleId(underModuleId);
    const [enrollment] = await db
      .select()
      .from(enrollmentsTable)
      .where(
        and(
          eq(enrollmentsTable.userId, userId),
          eq(enrollmentsTable.courseId, courseId),
        ),
      )
      .limit(1);
    if (!enrollment) return false;
    const siblings = await db
      .select()
      .from(underModulesTable)
      .where(eq(underModulesTable.moduleId, um.moduleId))
      .orderBy(asc(underModulesTable.order), asc(underModulesTable.id));
    const index = siblings.findIndex((s) => s.id === underModuleId);
    if (index < 0) return false;
    if (index === 0) return true;
    const prevId = siblings[index - 1].id;
    const [completed] = await db
      .select()
      .from(underModuleCompletionsTable)
      .where(
        and(
          eq(underModuleCompletionsTable.userId, userId),
          eq(underModuleCompletionsTable.underModuleId, prevId),
        ),
      )
      .limit(1);
    return !!completed;
  }

  async getAccess(userId: number, underModuleId: number) {
    const allowed = await this.canAccess(userId, underModuleId);
    return { access: allowed };
  }

  /** Порог в процентах для зачёта урока и курса */
  private readonly PASS_PERCENT = 70;

  /** Баллы по уроку: сумма макс. баллов и набранных; процент; зачёт (≥70%) */
  async getLessonScore(userId: number, lessonId: number) {
    const modules = await db
      .select({ id: modulesTable.id })
      .from(modulesTable)
      .where(eq(modulesTable.lessonId, lessonId));
    const moduleIds = modules.map((m) => m.id);
    if (moduleIds.length === 0) {
      return { totalMax: 0, totalEarned: 0, percent: 0, passed: true };
    }
    const underModules = await db
      .select({ id: underModulesTable.id, maxScore: underModulesTable.maxScore })
      .from(underModulesTable)
      .where(inArray(underModulesTable.moduleId, moduleIds));
    const totalMax = underModules.reduce((s, um) => s + (um.maxScore ?? 0), 0);
    const umIds = underModules.map((u) => u.id);
    const completions = await db
      .select({ score: underModuleCompletionsTable.score })
      .from(underModuleCompletionsTable)
      .where(
        and(
          eq(underModuleCompletionsTable.userId, userId),
          inArray(underModuleCompletionsTable.underModuleId, umIds),
        ),
      );
    const totalEarned = completions.reduce((s, c) => s + (c.score ?? 0), 0);
    const percent = totalMax > 0 ? Math.round((100 * totalEarned) / totalMax) : 0;
    const passed = percent >= this.PASS_PERCENT;
    return { totalMax, totalEarned, percent, passed };
  }

  /** Детали баллов по уроку: по каждому подмодулю (для отображения студенту) */
  async getLessonScoresDetail(userId: number, lessonId: number) {
    const modules = await db
      .select({ id: modulesTable.id })
      .from(modulesTable)
      .where(eq(modulesTable.lessonId, lessonId));
    const moduleIds = modules.map((m) => m.id);
    if (moduleIds.length === 0) return { items: [], lessonScore: { totalMax: 0, totalEarned: 0, percent: 0, passed: true } };
    const underModules = await db
      .select({ id: underModulesTable.id, title: underModulesTable.title, type: underModulesTable.type, maxScore: underModulesTable.maxScore, order: underModulesTable.order })
      .from(underModulesTable)
      .where(inArray(underModulesTable.moduleId, moduleIds))
      .orderBy(asc(underModulesTable.order), asc(underModulesTable.id));
    const umIds = underModules.map((u) => u.id);
    const completions = await db
      .select({ underModuleId: underModuleCompletionsTable.underModuleId, score: underModuleCompletionsTable.score })
      .from(underModuleCompletionsTable)
      .where(
        and(
          eq(underModuleCompletionsTable.userId, userId),
          inArray(underModuleCompletionsTable.underModuleId, umIds),
        ),
      );
    const scoreByUm = new Map(completions.map((c) => [c.underModuleId, c.score ?? 0]));
    const items = underModules.map((um) => ({
      underModuleId: um.id,
      title: um.title,
      type: um.type,
      maxScore: um.maxScore ?? 0,
      earnedScore: scoreByUm.get(um.id) ?? 0,
    }));
    const lessonScore = await this.getLessonScore(userId, lessonId);
    return { items, lessonScore };
  }

  /** Баллы по курсу: сумма по всем урокам; процент; курс засчитан (≥70%) */
  async getCourseScore(userId: number, courseId: number) {
    const lessons = await db
      .select({ id: lessonsTable.id })
      .from(lessonsTable)
      .where(eq(lessonsTable.courseId, courseId));
    let totalMax = 0;
    let totalEarned = 0;
    for (const l of lessons) {
      const s = await this.getLessonScore(userId, l.id);
      totalMax += s.totalMax;
      totalEarned += s.totalEarned;
    }
    const percent = totalMax > 0 ? Math.round((100 * totalEarned) / totalMax) : 0;
    const passed = percent >= this.PASS_PERCENT;
    return { totalMax, totalEarned, percent, passed };
  }

  /** Преподаватель выставляет балл за прохождение подмодуля студентом */
  async setCompletionScore(
    teacherUserId: number,
    studentUserId: number,
    underModuleId: number,
    score: number,
  ) {
    await this.ensureAuthorByUnderModule(teacherUserId, underModuleId);
    const [row] = await db
      .update(underModuleCompletionsTable)
      .set({ score: Math.max(0, score) })
      .where(
        and(
          eq(underModuleCompletionsTable.userId, studentUserId),
          eq(underModuleCompletionsTable.underModuleId, underModuleId),
        ),
      )
      .returning();
    if (!row) throw new NotFoundException('Прохождение не найдено (студент ещё не отметил задание)');
    return row;
  }
}
