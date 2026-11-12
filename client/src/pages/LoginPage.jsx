import { useState } from 'react';
import styled from 'styled-components';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import AuthShell from '../components/AuthShell';

const LoginPage = ({ setIsLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(location.state?.email ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectTo = location.state?.redirectTo || '/';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || '로그인에 실패했습니다.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user ?? { email }));
      setIsLoggedIn(true);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error('로그인 에러:', err);
      setError('서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="다시 만나서 반가워요"
      subtitle="저장해 둔 API 요청을 이어서 실행해 보세요."
      footer={
        <FooterText>
          아직 계정이 없나요? <Link to="/signup">회원가입</Link>
        </FooterText>
      }
    >
      <Form onSubmit={handleLogin}>
        <FieldGroup>
          <Label htmlFor="email">이메일</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </FieldGroup>

        <FieldGroup>
          <Label htmlFor="password">비밀번호</Label>
          <PasswordWrap>
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <EyeButton
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </EyeButton>
          </PasswordWrap>
        </FieldGroup>

        {error && <ErrorBox>{error}</ErrorBox>}

        <SubmitButton type="submit" disabled={loading}>
          {loading ? '로그인 중...' : '로그인'}
        </SubmitButton>
      </Form>
    </AuthShell>
  );
};

export default LoginPage;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const Label = styled.label`
  font-size: 12px;
  font-weight: 700;
  color: #495057;
`;

const PasswordWrap = styled.div`
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #dee2e6;
  border-radius: 9px;
  font-size: 14px;
  color: #212529;
  background: #fff;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: #ff6c37;
    box-shadow: 0 0 0 3px rgba(255, 108, 55, 0.13);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const EyeButton = styled.button`
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  display: grid;
  place-items: center;
  background: none;
  color: #868e96;
  font-size: 14px;
  padding: 4px;
`;

const ErrorBox = styled.p`
  padding: 11px 13px;
  border-radius: 8px;
  background: #fff5f5;
  border: 1px solid #ffc9c9;
  color: #c92a2a;
  font-size: 12px;
  line-height: 1.5;
`;

const SubmitButton = styled.button`
  margin-top: 4px;
  padding: 13px;
  border-radius: 9px;
  background: #ff6c37;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  transition: background 0.15s, transform 0.15s;

  &:hover:not(:disabled) {
    background: #e85a28;
  }

  &:active:not(:disabled) {
    transform: translateY(1px);
  }

  &:disabled {
    background: #ffb59b;
    cursor: not-allowed;
  }
`;

const FooterText = styled.p`
  margin-top: 22px;
  font-size: 13px;
  color: #868e96;

  a {
    color: #ff6c37;
    font-weight: 700;

    &:hover {
      text-decoration: underline;
    }
  }
`;
