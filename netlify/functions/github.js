exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };
  try {
    const { url, token } = JSON.parse(event.body);
    if (!url || !url.startsWith('https://api.github.com/')) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid URL' }) };
    }
    const r = await fetch(url, {
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'resume-builder'
      }
    });
    const data = await r.json();
    return {
      statusCode: r.status,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
