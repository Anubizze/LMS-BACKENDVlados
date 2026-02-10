/**
 * Применяет миграцию 0007 (тип задания + баллы).
 * Запуск из папки backend: node scripts/run-migration-0007.js
 * Или: pnpm run db:run-0007
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const { Client } = require('pg');

const sqlPath = path.join(__dirname, '..', 'drizzle', '0007_add_assignment_type_and_scores.sql');
const sql = fs.readFileSync(sqlPath, 'utf8');

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL не задан в .env');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Миграция 0007 применена.');
  } catch (err) {
    console.error('Ошибка миграции:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
