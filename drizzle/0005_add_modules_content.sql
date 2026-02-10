-- Контент подмодуля: заголовок, текст, ссылка на видео
CREATE TABLE IF NOT EXISTS "modules_content" (
  "id" serial PRIMARY KEY NOT NULL,
  "under_module_id" integer NOT NULL REFERENCES "under_modules"("id") ON DELETE CASCADE,
  "title" varchar(500) NOT NULL,
  "text" varchar(10000),
  "video" varchar(1000),
  "order" integer DEFAULT 0
);
