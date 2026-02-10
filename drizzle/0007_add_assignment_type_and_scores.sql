-- Тип задания: Введение, Теория, Видео, Практика, Тест
DO $$ BEGIN
  CREATE TYPE "assignment_type" AS ENUM('introduction', 'theory', 'video', 'practice', 'test');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "under_modules" ADD COLUMN IF NOT EXISTS "type" "assignment_type" DEFAULT 'theory' NOT NULL;
ALTER TABLE "under_modules" ADD COLUMN IF NOT EXISTS "max_score" integer DEFAULT 20 NOT NULL;

ALTER TABLE "under_module_completions" ADD COLUMN IF NOT EXISTS "score" integer DEFAULT 0 NOT NULL;
