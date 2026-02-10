-- Модули внутри урока (содержимое урока: преподаватель добавляет модули к каждому уроку)
CREATE TABLE IF NOT EXISTS "modules" (
  "id" serial PRIMARY KEY NOT NULL,
  "lesson_id" integer NOT NULL REFERENCES "lessons"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "order" integer DEFAULT 0
);
