import express from 'express';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const BLOCKED_HEADERS = new Set([
  'host',
  'content-length',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'upgrade',
]);

router.post('/', authenticateToken, async (req, res) => {
  const { url, method = 'GET', headers = {}, body = null } = req.body ?? {};

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ message: '요청 URL을 입력해 주세요.' });
  }

  const methodUpper = String(method).toUpperCase();

  if (!ALLOWED_METHODS.includes(methodUpper)) {
    return res.status(400).json({ message: '지원하지 않는 HTTP 메서드입니다.' });
  }

  let targetUrl;

  try {
    const selfOrigin = `http://127.0.0.1:${process.env.PORT || 5000}`;
    targetUrl = new URL(url, selfOrigin);
  } catch {
    return res.status(400).json({ message: '올바른 URL 형식이 아닙니다.' });
  }

  if (!['http:', 'https:'].includes(targetUrl.protocol)) {
    return res.status(400).json({ message: 'http:// 또는 https:// URL만 사용할 수 있습니다.' });
  }

  if (targetUrl.pathname === '/api/proxy') {
    return res.status(400).json({ message: '프록시 주소로는 요청을 보낼 수 없습니다.' });
  }

  const forwardedHeaders = {};

  if (headers && typeof headers === 'object' && !Array.isArray(headers)) {
    Object.entries(headers).forEach(([key, value]) => {
      const normalizedKey = String(key).toLowerCase();
      if (!BLOCKED_HEADERS.has(normalizedKey) && value !== undefined && value !== null) {
        forwardedHeaders[key] = String(value);
      }
    });
  }

  const canHaveBody = !['GET', 'HEAD'].includes(methodUpper);
  const requestBody = canHaveBody && body !== null && body !== undefined ? String(body) : undefined;

  const startedAt = performance.now();

  try {
    const response = await fetch(targetUrl, {
      method: methodUpper,
      headers: forwardedHeaders,
      body: requestBody,
      redirect: 'follow',
      signal: AbortSignal.timeout(30000),
    });

    const responseBody = await response.text();
    const elapsed = Math.round(performance.now() - startedAt);

    return res.json({
      status: response.status,
      statusText: response.statusText,
      headers: Array.from(response.headers.entries()),
      body: responseBody,
      time: elapsed,
      size: Buffer.byteLength(responseBody),
    });
  } catch (error) {
    console.error('POST /api/proxy 에러:', error.message);

    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return res.status(504).json({ message: '대상 서버의 응답 시간이 초과되었습니다. (30초)' });
    }

    return res.status(502).json({
      message: `대상 서버에 연결할 수 없습니다: ${error.message}`,
    });
  }
});

export default router;
