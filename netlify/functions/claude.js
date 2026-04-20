exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return {
    statusCode: 500,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'ANTHROPIC_API_KEY not set in Netlify environment variables' })
  };

  try {
    const body = JSON.parse(event.body);
    const streaming = body.stream === true;

    const requestBody = {
      ...body,
      stream: streaming
    };

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (streaming) {
      // Collect the full SSE stream from Anthropic and return it as text
      // Netlify functions can't truly stream, so we buffer and return
      const text = await r.text();
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Access-Control-Allow-Origin': '*'
        },
        body: text
      };
    } else {
      const data = await r.json();
      return {
        statusCode: r.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(data)
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: e.message })
    };
  }
};
