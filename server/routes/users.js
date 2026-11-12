import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/signup', async (req, res) => {
  const { email, password, nickname } = req.body;

  if (!email || !password || !nickname) {
    return res.status(400).json({ message: '모든 필수 정보를 입력해 주세요.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users (email, password, nickname)
       VALUES (?, ?, ?)`,
      [email, hashedPassword, nickname]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, email, nickname },
      process.env.JWT_SECRET ?? 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: { id: userId, email, nickname }
    });

  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '이미 등록된 이메일입니다.' });
    }
    console.error('회원가입 에러:', error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해 주세요.' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, email, password, nickname FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: '등록된 회원 정보가 없습니다.' });
    }

    const [user] = rows;
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, nickname: user.nickname },
      process.env.JWT_SECRET ?? 'fallback_secret_key',
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      message: '로그인 성공',
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname }
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    return res.status(500).json({ message: '서버 에러가 발생했습니다.' });
  }
});


router.get('/me/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.user_id;

    if (!userId) {
      console.error('❌ 토큰 유저 정보에 ID가 없습니다:', req.user);
      return res.status(400).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    const [rows] = await db.query(
      `SELECT
         u.id, u.email, u.nickname, u.created_at,
         COUNT(r.id) AS request_count,
         COALESCE(SUM(r.method = 'GET'), 0) AS get_count,
         COALESCE(SUM(r.method = 'POST'), 0) AS post_count,
         COALESCE(SUM(r.method = 'PUT'), 0) AS put_count,
         COALESCE(SUM(r.method = 'PATCH'), 0) AS patch_count,
         COALESCE(SUM(r.method = 'DELETE'), 0) AS delete_count,
         MAX(r.updated_at) AS last_request_at
       FROM users u
       LEFT JOIN requests r ON r.user_id = u.id
       WHERE u.id = ?
       GROUP BY u.id, u.email, u.nickname, u.created_at`,
      [userId]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const row = rows[0];

    return res.json({
      user: {
        id: row.id,
        email: row.email,
        nickname: row.nickname,
        createdAt: row.created_at,
      },
      stats: {
        requestCount: Number(row.request_count) || 0,
        getCount: Number(row.get_count) || 0,
        postCount: Number(row.post_count) || 0,
        putCount: Number(row.put_count) || 0,
        patchCount: Number(row.patch_count) || 0,
        deleteCount: Number(row.delete_count) || 0,
        lastRequestAt: row.last_request_at ?? null,
      },
    });
  } catch (error) {
    console.error('❌ GET /api/users/me/overview 500 에러 발생:', error);
    return res.status(500).json({ message: '워크스페이스 통계를 불러오지 못했습니다.' });
  }
});

router.get('/me/top-endpoints', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.user_id;

    if (!userId) {
      console.error('❌ 토큰 유저 정보에 ID가 없습니다:', req.user);
      return res.status(400).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isNaN(requestedLimit)
      ? 5
      : Math.min(Math.max(requestedLimit, 1), 20);

    const [rows] = await db.query(
      `SELECT
         r.url,
         COUNT(*) AS request_count,
         MAX(r.updated_at) AS last_used_at
       FROM users u
       JOIN requests r ON r.user_id = u.id
       WHERE u.id = ?
       GROUP BY r.url
       ORDER BY request_count DESC, last_used_at DESC
       LIMIT ?`,
      [userId, limit]
    );

    return res.json({
      topEndpoints: rows.map((row) => ({
        url: row.url,
        requestCount: Number(row.request_count) || 0,
        lastUsedAt: row.last_used_at ?? null,
      })),
    });
  } catch (error) {
    console.error('❌ GET /api/users/me/top-endpoints 500 에러 발생:', error);
    return res.status(500).json({ message: '자주 사용한 URL을 불러오지 못했습니다.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.user_id;

    if (!userId) {
      console.error('❌ 토큰 유저 정보에 ID가 없습니다:', req.user);
      return res.status(400).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    const [users] = await db.query(
      'SELECT id, email, nickname, created_at FROM users WHERE id = ?',
      [userId]
    );

    if (!users || users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    res.json(users[0]);
  } catch (error) {
    console.error('❌ GET /api/users/me 500 에러 발생:', error);
    res.status(500).json({ message: '서버 내부 오류가 발생했습니다.' });
  }
});

router.put('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?.user_id;
    const { currentPassword, nickname } = req.body;

    if (!userId) {
      return res.status(400).json({ message: '유효하지 않은 토큰 정보입니다.' });
    }

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);

    if (!users || users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: '현재 비밀번호가 일치하지 않습니다.' });
    }

    await db.query(
      'UPDATE users SET nickname = ? WHERE id = ?',
      [nickname, userId]
    );

    res.json({ message: '프로필 정보가 성공적으로 수정되었습니다.' });
  } catch (error) {
    console.error('❌ PUT /api/users/me 500 에러 발생:', error);
    res.status(500).json({ message: '프로필 수정 중 서버 오류가 발생했습니다.' });
  }
});

router.delete('/me', authenticateToken, async (req, res) => {
  const { password } = req.body;
  const userId = req.user?.id || req.user?.userId;

  try {
    if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
    }

    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (!users || users.length === 0) {
      return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
    }

    const user = users[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }
    
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ message: '회원 탈퇴가 정상적으로 처리되었습니다.' });
  } catch (error) {
    console.error('DELETE /api/users/me 에러:', error);
    res.status(500).json({ message: '회원 탈퇴 처리 중 오류가 발생했습니다.' });
  }
});


export default router;