/**
 * Netlify Function: логин.
 * Вызов: POST /.netlify/functions/login
 * Body: { "email": "...", "password": "..." }
 *
 * Сейчас — заглушка. Для продакшена подключи БД (pg/drizzle) и проверку пароля (bcrypt),
 * либо проксируй запрос на твой NestJS API.
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

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  let body;
  try {
    body = event.body ? JSON.parse(event.body) : {};
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }

  const { email, password } = body;
  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'email and password are required' }),
    };
  }

  // TODO: проверка в БД, выдача JWT (как в NestJS auth.service)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Login endpoint (stub). Connect DB and JWT.',
      user: { email },
    }),
  };
};
