import express from 'express';
import db from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const ALLOWED_BODY_TYPES = ['none', 'json', 'text'];

router.use(authenticateToken);

const getUserId = (req) => req.user?.id ?? req.user?.userId ?? req.user?.user_id;

const safeParse = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeRows = (rows) => {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row && typeof row === 'object')
    .map((row) => ({
      key: String(row.key ?? ''),
      value: String(row.value ?? ''),
      description: String(row.description ?? ''),
      enabled: row.enabled !== false,
    }))
    .filter((row) => row.key !== '' || row.value !== '');
};

const mapRow = (row) => ({
  id: row.id,
  name: row.name,
  method: row.method,
  url: row.url,
  headers: normalizeRows(safeParse(row.header, [])),
  queryParams: normalizeRows(safeParse(row.query_params, [])),
  body: row.body ?? '',
  bodyType: row.body_type ?? 'none',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const normalizePayload = (body) => {
  const name = String(body.name ?? '').trim() || 'Untitled Request';
  const method = String(body.method ?? 'GET').toUpperCase();
  const url = String(body.url ?? '').trim();

  if (!ALLOWED_METHODS.includes(method)) {
    return { error: '지원하지 않는 HTTP 메서드입니다.' };
  }

  if (!url) {
    return { error: '요청 URL을 입력해 주세요.' };
  }

  const bodyType = ALLOWED_BODY_TYPES.includes(body.bodyType) ? body.bodyType : 'none';

  return {
    data: {
      name,
      method,
      url,
      headers: normalizeRows(body.headers),
      queryParams: normalizeRows(body.queryParams),
      body: bodyType === 'none' ? null : String(body.body ?? ''),
      bodyType,
    },
  };
};

router.get('/', async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ message: '유효하지 않은 토큰 정보입니다.' });
  }

  const { search, method } = req.query;

  try {
    let sql = `
      SELECT id, name, method, url, header, query_params, body, body_type, created_at, updated_at
      FROM requests
      WHERE user_id = ?
    `;
    const params = [userId];

    if (search && String(search).trim()) {
      sql += ' AND (name LIKE ? OR url LIKE ?)';
      const keyword = `%${String(search).trim()}%`;
      params.push(keyword, keyword);
    }

    if (method && String(method).trim()) {
      sql += ' AND method = ?';
      params.push(String(method).toUpperCase());
    }

    sql += ' ORDER BY updated_at DESC, id DESC';

    const [rows] = await db.query(sql, params);
    return res.json(rows.map(mapRow));
  } catch (error) {
    console.error('GET /api/requests 에러:', error);
    return res.status(500).json({ message: '요청 목록을 불러오지 못했습니다.' });
  }
});

router.get('/:id', async (req, res) => {
  const userId = getUserId(req);

  try {
    const [rows] = await db.query(
      `SELECT id, name, method, url, header, query_params, body, body_type, created_at, updated_at
       FROM requests WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }

    return res.json(mapRow(rows[0]));
  } catch (error) {
    console.error('GET /api/requests/:id 에러:', error);
    return res.status(500).json({ message: '요청을 불러오지 못했습니다.' });
  }
});

router.post('/', async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = normalizePayload(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO requests (name, method, url, header, query_params, body, body_type, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.name,
        data.method,
        data.url,
        JSON.stringify(data.headers),
        JSON.stringify(data.queryParams),
        data.body,
        data.bodyType,
        userId,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, name, method, url, header, query_params, body, body_type, created_at, updated_at
       FROM requests WHERE id = ? AND user_id = ?`,
      [result.insertId, userId]
    );

    return res.status(201).json(mapRow(rows[0]));
  } catch (error) {
    console.error('POST /api/requests 에러:', error);
    return res.status(500).json({ message: '요청을 저장하지 못했습니다.' });
  }
});

router.put('/:id', async (req, res) => {
  const userId = getUserId(req);
  const { data, error } = normalizePayload(req.body);

  if (error) {
    return res.status(400).json({ message: error });
  }

  try {
    const [existing] = await db.query(
      'SELECT id FROM requests WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );

    if (existing.length === 0) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }

    await db.query(
      `UPDATE requests
       SET name = ?, method = ?, url = ?, header = ?, query_params = ?, body = ?, body_type = ?
       WHERE id = ? AND user_id = ?`,
      [
        data.name,
        data.method,
        data.url,
        JSON.stringify(data.headers),
        JSON.stringify(data.queryParams),
        data.body,
        data.bodyType,
        req.params.id,
        userId,
      ]
    );

    const [rows] = await db.query(
      `SELECT id, name, method, url, header, query_params, body, body_type, created_at, updated_at
       FROM requests WHERE id = ? AND user_id = ?`,
      [req.params.id, userId]
    );

    return res.json(mapRow(rows[0]));
  } catch (error) {
    console.error('PUT /api/requests/:id 에러:', error);
    return res.status(500).json({ message: '요청을 수정하지 못했습니다.' });
  }
});

router.delete('/:id', async (req, res) => {
  const userId = getUserId(req);

  try {
    const [result] = await db.query(
      'DELETE FROM requests WHERE id = ? AND user_id = ?',
      [req.params.id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
    }

    return res.json({ message: '요청이 삭제되었습니다.', id: Number(req.params.id) });
  } catch (error) {
    console.error('DELETE /api/requests/:id 에러:', error);
    return res.status(500).json({ message: '요청을 삭제하지 못했습니다.' });
  }
});

export default router;
