-- Подмодули внутри модуля (преподаватель добавляет подмодули к каждому модулю)
CREATE TABLE IF NOT EXISTS "under_modules" (
  "id" serial PRIMARY KEY NOT NULL,
  "module_id" integer NOT NULL REFERENCES "modules"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "order" integer DEFAULT 0
);
