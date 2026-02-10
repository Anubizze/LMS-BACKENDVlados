/**
 * Тестовая Netlify Function — проверка работы серверных функций.
 * Вызов: GET/POST /.netlify/functions/hello
 */
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      message: 'Hello from Netlify Functions',
      timestamp: new Date().toISOString(),
    }),
  };
};
