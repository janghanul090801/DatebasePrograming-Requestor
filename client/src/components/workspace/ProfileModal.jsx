import { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  FaExclamationTriangle,
  FaSpinner,
  FaTimes,
  FaUserEdit,
  FaUserSlash,
} from 'react-icons/fa';

const TABS = [
  { id: 'profile', label: '프로필 수정', icon: <FaUserEdit /> },
  { id: 'withdraw', label: '회원 탈퇴', icon: <FaUserSlash /> },
];

const ProfileModal = ({ user, onClose, onUpdate, onWithdraw }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [nickname, setNickname] = useState(user?.nickname ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [withdrawPassword, setWithdrawPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Esc 키로 닫기
  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!nickname.trim()) {
      setError('닉네임을 입력해 주세요.');
      return;
    }

    if (!currentPassword) {
      setError('현재 비밀번호를 입력해 주세요.');
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onUpdate({
        currentPassword,
        nickname: nickname.trim(),
      });
    } catch (err) {
      setError(err.message || '프로필 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!withdrawPassword) {
      setError('비밀번호를 입력해 주세요.');
      return;
    }

    if (!window.confirm('정말 탈퇴하시겠어요? 저장된 모든 요청이 함께 삭제되며 되돌릴 수 없습니다.')) {
      return;
    }

    setError('');
    setSubmitting(true);

    try {
      await onWithdraw(withdrawPassword);
    } catch (err) {
      setError(err.message || '회원 탈퇴에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <Dialog role="dialog" aria-modal="true" aria-label="계정 관리">
        <Header>
          <HeaderText>
            <Title>계정 관리</Title>
            <Subtitle>{user?.email || '내 계정'}</Subtitle>
          </HeaderText>
          <CloseButton type="button" onClick={onClose} title="닫기">
            <FaTimes />
          </CloseButton>
        </Header>

        <TabBar>
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              type="button"
              $active={activeTab === tab.id}
              $danger={tab.id === 'withdraw'}
              onClick={() => switchTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </TabButton>
          ))}
        </TabBar>

        <Body>
          {activeTab === 'profile' ? (
            <Form onSubmit={handleUpdate}>
              <FieldGroup>
                <Label htmlFor="profile-email">이메일</Label>
                <Input
                  id="profile-email"
                  value={user?.email ?? ''}
                  readOnly
                  disabled
                />
                <Hint>이메일은 변경할 수 없습니다.</Hint>
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="profile-nickname">닉네임</Label>
                <Input
                  id="profile-nickname"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="닉네임 입력"
                  maxLength={50}
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="profile-password">현재 비밀번호</Label>
                <Input
                  id="profile-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="변경 사항 저장 시 필요합니다"
                  autoComplete="current-password"
                  required
                />
              </FieldGroup>

              {error && <ErrorBox>{error}</ErrorBox>}

              <Actions>
                <SecondaryButton type="button" onClick={onClose} disabled={submitting}>
                  취소
                </SecondaryButton>
                <PrimaryButton type="submit" disabled={submitting}>
                  {submitting ? <FaSpinner className="spin" /> : <FaUserEdit />}
                  {submitting ? '저장 중...' : '변경 사항 저장'}
                </PrimaryButton>
              </Actions>
            </Form>
          ) : (
            <Form onSubmit={handleWithdraw}>
              <DangerNotice>
                <FaExclamationTriangle />
                <span>
                  회원 탈퇴 시 계정과 함께 저장된 모든 요청이 영구적으로 삭제됩니다.
                  이 작업은 되돌릴 수 없습니다.
                </span>
              </DangerNotice>

              <FieldGroup>
                <Label htmlFor="withdraw-password">비밀번호 확인</Label>
                <Input
                  id="withdraw-password"
                  type="password"
                  value={withdrawPassword}
                  onChange={(e) => setWithdrawPassword(e.target.value)}
                  placeholder="탈퇴하려면 비밀번호를 입력하세요"
                  autoComplete="current-password"
                  required
                />
              </FieldGroup>

              {error && <ErrorBox>{error}</ErrorBox>}

              <Actions>
                <SecondaryButton type="button" onClick={onClose} disabled={submitting}>
                  취소
                </SecondaryButton>
                <DangerButton type="submit" disabled={submitting}>
                  {submitting ? <FaSpinner className="spin" /> : <FaUserSlash />}
                  {submitting ? '처리 중...' : '회원 탈퇴'}
                </DangerButton>
              </Actions>
            </Form>
          )}
        </Body>
      </Dialog>
    </Overlay>
  );
};

export default ProfileModal;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 60;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(20, 20, 20, 0.55);
  backdrop-filter: blur(2px);
  animation: overlay-in 0.15s ease-out;

  @keyframes overlay-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const Dialog = styled.div`
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  border-radius: 14px;
  background: #fff;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.3);
  animation: dialog-in 0.16s ease-out;

  @keyframes dialog-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 22px 14px;
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const Title = styled.h2`
  color: #171717;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.02em;
`;

const Subtitle = styled.p`
  margin-top: 4px;
  overflow: hidden;
  color: #868e96;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CloseButton = styled.button`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 7px;
  background: #f1f3f5;
  color: #868e96;
  font-size: 12px;

  &:hover {
    background: #e9ecef;
    color: #343a40;
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 22px;
  border-bottom: 1px solid #ececec;
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: transparent;
  border-bottom: 2px solid
    ${(props) => (props.$active ? (props.$danger ? '#e03131' : '#ff6c37') : 'transparent')};
  color: ${(props) => {
    if (!props.$active) return '#868e96';
    return props.$danger ? '#e03131' : '#212529';
  }};
  font-size: 12px;
  font-weight: ${(props) => (props.$active ? '800' : '600')};

  &:hover {
    color: ${(props) => (props.$danger ? '#e03131' : '#212529')};
  }
`;

const Body = styled.div`
  padding: 18px 22px 22px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  color: #495057;
  font-size: 11px;
  font-weight: 700;
`;

const Hint = styled.p`
  color: #adb5bd;
  font-size: 10px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  background: #fff;
  color: #212529;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    border-color: #ff6c37;
    box-shadow: 0 0 0 3px rgba(255, 108, 55, 0.13);
  }

  &:disabled {
    background: #f8f9fa;
    color: #868e96;
    cursor: not-allowed;
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const ErrorBox = styled.p`
  padding: 10px 12px;
  border: 1px solid #ffc9c9;
  border-radius: 8px;
  background: #fff5f5;
  color: #c92a2a;
  font-size: 11px;
  line-height: 1.5;
`;

const DangerNotice = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 12px;
  border: 1px solid #ffc9c9;
  border-radius: 8px;
  background: #fff5f5;
  color: #c92a2a;
  font-size: 11px;
  line-height: 1.65;

  svg {
    flex-shrink: 0;
    margin-top: 2px;
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
`;

const SecondaryButton = styled.button`
  padding: 9px 14px;
  border: 1px solid #dee2e6;
  border-radius: 7px;
  background: #fff;
  color: #495057;
  font-size: 12px;
  font-weight: 700;

  &:hover:not(:disabled) {
    background: #f8f9fa;
  }

  &:disabled {
    color: #b1b1b1;
  }
`;

const PrimaryButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 7px;
  background: #ff6c37;
  color: #fff;
  font-size: 12px;
  font-weight: 800;

  &:hover:not(:disabled) {
    background: #e85a28;
  }

  &:disabled {
    background: #ffb59b;
  }
`;

const DangerButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 15px;
  border-radius: 7px;
  background: #e03131;
  color: #fff;
  font-size: 12px;
  font-weight: 800;

  &:hover:not(:disabled) {
    background: #c92a2a;
  }

  &:disabled {
    background: #ffa8a8;
  }
`;
