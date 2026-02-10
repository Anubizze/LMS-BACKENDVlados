-- Прохождение подмодуля пользователем (доступ по цепочке + процент прохождения курса)
CREATE TABLE IF NOT EXISTS "under_module_completions" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "under_module_id" integer NOT NULL REFERENCES "under_modules"("id") ON DELETE CASCADE,
  "completed_at" timestamp DEFAULT now() NOT NULL,
  UNIQUE("user_id", "under_module_id")
);
