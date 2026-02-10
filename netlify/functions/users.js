/**
 * Netlify Function: работа с пользователями.
 * Вызов: GET /.netlify/functions/users — список (заглушка)
 *       GET /.netlify/functions/users?id=... — один пользователь (заглушка)
 *
 * Для продакшена подключи БД (pg/drizzle) и авторизацию (JWT из заголовка).
 */
exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  const id = event.queryStringParameters?.id;

  // TODO: запрос в БД (drizzle/pg), проверка JWT для защищённых данных
  if (id) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: { id, email: 'stub@example.com', role: 'user' },
        message: 'Users endpoint (stub). Connect DB.',
      }),
    };
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      users: [],
      message: 'Users list (stub). Connect DB.',
    }),
  };
};
