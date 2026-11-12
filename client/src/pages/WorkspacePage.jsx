import { useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { Navigate, useNavigate } from 'react-router-dom';
import Sidebar from '../components/workspace/Sidebar';
import RequestBuilder from '../components/workspace/RequestBuilder';
import ResponsePanel from '../components/workspace/ResponsePanel';
import ProfileModal from '../components/workspace/ProfileModal';
import { requestsApi } from '../api/requests';
import { usersApi } from '../api/users';
import { sendRequest } from '../api/proxy';
import {
  buildUrl,
  createEmptyRequest,
  normalizeRequestUrl,
} from '../utils/requestUtils';

const getUserEmail = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}').email || '';
  } catch {
    return '';
  }
};

const WorkspacePage = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  const [savedRequests, setSavedRequests] = useState([]);
  const [activeRequest, setActiveRequest] = useState(createEmptyRequest);
  const [overview, setOverview] = useState(null);
  const [topEndpoints, setTopEndpoints] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [response, setResponse] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 760);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [userEmail] = useState(getUserEmail);

  const toastTimer = useRef(null);
  const saveRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(toastTimer.current);
  }, []);

  const handleAuthError = useCallback(
    (error) => {
      if (error?.status === 401 || error?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsLoggedIn(false);
        navigate('/login', { replace: true, state: { redirectTo: '/' } });
        return true;
      }
      return false;
    },
    [navigate, setIsLoggedIn]
  );

  // 프로필 통계 + 자주 쓰는 URL 갱신
  const refreshStats = useCallback(async () => {
    try {
      const [overviewData, endpointData] = await Promise.all([
        usersApi.getOverview(),
        usersApi.getTopEndpoints(),
      ]);

      setOverview(overviewData);
      setTopEndpoints(endpointData.topEndpoints ?? []);
    } catch (error) {
      handleAuthError(error);
    }
  }, [handleAuthError]);

  // 저장된 요청 목록 + 워크스페이스 통계 불러오기
  useEffect(() => {
    if (!isLoggedIn) return undefined;

    let cancelled = false;

    const load = async () => {
      try {
        const [list, overviewData, endpointData] = await Promise.all([
          requestsApi.list(),
          usersApi.getOverview(),
          usersApi.getTopEndpoints(),
        ]);

        if (cancelled) return;

        setSavedRequests(list);
        setOverview(overviewData);
        setTopEndpoints(endpointData.topEndpoints ?? []);

        if (list.length > 0) {
          setActiveRequest(list[0]);
        }
      } catch (error) {
        if (!cancelled && !handleAuthError(error)) {
          showToast(error.message, 'error');
        }
      } finally {
        if (!cancelled) setLoadingList(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, handleAuthError, showToast]);

  // 저장하지 않은 변경사항이 있으면 새로고침 전에 경고
  useEffect(() => {
    if (!dirty) return undefined;

    const handler = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const handleChange = (patch) => {
    setActiveRequest((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  };

  const confirmDiscard = () => {
    if (!dirty) return true;
    return window.confirm('저장하지 않은 변경사항이 있습니다. 계속할까요?');
  };

  const handleCreate = () => {
    if (!confirmDiscard()) return;
    setActiveRequest(createEmptyRequest());
    setDirty(false);
    setResponse(null);
  };

  const handleSelect = async (id) => {
    if (id === activeRequest.id) return;
    if (!confirmDiscard()) return;

    try {
      const detail = await requestsApi.get(id);
      setActiveRequest(detail);
      setDirty(false);
      setResponse(null);
    } catch (error) {
      if (!handleAuthError(error)) showToast(error.message, 'error');
    }
  };

  const buildPayload = () => ({
    name: activeRequest.name?.trim() || 'Untitled Request',
    method: activeRequest.method,
    url: buildUrl(activeRequest.url, activeRequest.queryParams),
    headers: activeRequest.headers,
    queryParams: activeRequest.queryParams,
    body: activeRequest.body,
    bodyType: activeRequest.bodyType,
  });

  const handleSave = async () => {
    if (saving) return;
    if (!activeRequest.url.trim()) {
      showToast('저장할 요청 URL을 입력해 주세요.', 'error');
      return;
    }

    setSaving(true);

    try {
      const payload = buildPayload();
      const saved = activeRequest.id
        ? await requestsApi.update(activeRequest.id, payload)
        : await requestsApi.create(payload);

      setActiveRequest(saved);
      setSavedRequests((prev) => {
        const exists = prev.some((item) => item.id === saved.id);
        const next = exists
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...prev];

        return [...next].sort(
          (a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0)
        );
      });
      setDirty(false);

      showToast(activeRequest.id ? '요청이 수정되었습니다.' : '요청이 저장되었습니다.');
      refreshStats();
    } catch (error) {
      if (!handleAuthError(error)) showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    saveRef.current = handleSave;
  });

  const handleDelete = async (id) => {
    if (!window.confirm('이 요청을 삭제할까요?')) return;

    try {
      await requestsApi.remove(id);
      setSavedRequests((prev) => prev.filter((item) => item.id !== id));

      if (activeRequest.id === id) {
        setActiveRequest(createEmptyRequest());
        setDirty(false);
        setResponse(null);
      }

      showToast('요청이 삭제되었습니다.');
      refreshStats();
    } catch (error) {
      if (!handleAuthError(error)) showToast(error.message, 'error');
    }
  };

  const handleSend = async () => {
    if (sending) return;

    const url = normalizeRequestUrl(
      buildUrl(activeRequest.url, activeRequest.queryParams)
    );

    if (!url) {
      showToast('요청 URL을 입력해 주세요.', 'error');
      return;
    }

    const method = activeRequest.method.toUpperCase();
    const headers = {};

    activeRequest.headers.forEach((header) => {
      const key = String(header.key ?? '').trim();
      if (header.enabled !== false && key) {
        headers[key] = String(header.value ?? '');
      }
    });

    let requestBody;
    const canHaveBody = !['GET', 'HEAD'].includes(method);

    if (canHaveBody && activeRequest.bodyType !== 'none' && activeRequest.body.trim()) {
      requestBody = activeRequest.body;

      const hasContentType = Object.keys(headers).some(
        (key) => key.toLowerCase() === 'content-type'
      );

      if (activeRequest.bodyType === 'json' && !hasContentType) {
        headers['Content-Type'] = 'application/json';
      }
    }

    setSending(true);
    setResponse(null);

    try {
      // CORS 문제를 피하기 위해 서버 프록시가 대상 API를 대신 호출한다.
      const result = await sendRequest({
        url,
        method,
        headers,
        body: requestBody ?? null,
      });

      setResponse(result);
    } catch (error) {
      if (handleAuthError(error)) return;

      setResponse({
        error: true,
        message: error.message || '네트워크 오류가 발생했습니다.',
        headers: [],
        time: 0,
        size: 0,
      });
    } finally {
      setSending(false);
    }
  };

  // Ctrl/Cmd + S 저장, Ctrl/Cmd + Enter 전송
  useEffect(() => {
    const handler = (event) => {
      const modifier = event.ctrlKey || event.metaKey;

      if (modifier && event.key.toLowerCase() === 's') {
        event.preventDefault();
        saveRef.current?.();
      }

      if (modifier && event.key === 'Enter') {
        event.preventDefault();
        handleSend();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  // 계정 관리 모달 열기 (최신 프로필 조회)
  const handleOpenProfile = async () => {
    try {
      const me = await usersApi.getMe();
      setProfileUser({
        id: me.id,
        email: me.email,
        nickname: me.nickname,
      });
    } catch (error) {
      if (handleAuthError(error)) return;
      setProfileUser(overview?.user ?? null);
      showToast(error.message, 'error');
    }

    setProfileOpen(true);
  };

  // 프로필 수정 (PUT /api/users/me)
  const handleUpdateProfile = async (payload) => {
    try {
      const data = await usersApi.updateMe(payload);

      try {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem(
          'user',
          JSON.stringify({ ...stored, nickname: payload.nickname })
        );
      } catch {
        // localStorage 값이 깨져 있어도 프로필 수정은 계속 진행한다.
      }

      setProfileUser((prev) => ({
        ...prev,
        nickname: payload.nickname,
      }));
      setOverview((prev) =>
        prev
          ? {
              ...prev,
              user: {
                ...prev.user,
                nickname: payload.nickname,
              },
            }
          : prev
      );

      setProfileOpen(false);
      showToast(data?.message || '프로필 정보가 수정되었습니다.');
      refreshStats();
    } catch (error) {
      if (handleAuthError(error)) return;
      throw error;
    }
  };

  // 회원 탈퇴 (DELETE /api/users/me)
  const handleWithdraw = async (password) => {
    try {
      await usersApi.withdraw(password);

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setProfileOpen(false);
      setIsLoggedIn(false);
      navigate('/login', {
        replace: true,
        state: {
          email: profileUser?.email || overview?.user?.email || userEmail,
        },
      });
    } catch (error) {
      if (handleAuthError(error)) return;
      throw error;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login', { replace: true });
  };

  if (!isLoggedIn) {
    return <Navigate to="/login" replace state={{ redirectTo: '/' }} />;
  }

  return (
    <Shell>
      {sidebarOpen && (
        <Sidebar
          requests={savedRequests}
          activeId={activeRequest.id}
          loading={loadingList}
          userEmail={userEmail}
          overview={overview}
          topEndpoints={topEndpoints}
          onCreate={handleCreate}
          onSelect={handleSelect}
          onDelete={handleDelete}
          onLogout={handleLogout}
          onOpenProfile={handleOpenProfile}
          onCollapse={() => setSidebarOpen(false)}
        />
      )}

      <Main>
        <RequestBuilder
          request={activeRequest}
          author={activeRequest.id ? overview?.user : null}
          dirty={dirty}
          saving={saving}
          sending={sending}
          sidebarOpen={sidebarOpen}
          onChange={handleChange}
          onSave={handleSave}
          onSend={handleSend}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <ResponsePanel response={response} sending={sending} />
      </Main>

      {toast && <Toast $type={toast.type}>{toast.message}</Toast>}

      {profileOpen && (
        <ProfileModal
          user={profileUser}
          onClose={() => setProfileOpen(false)}
          onUpdate={handleUpdateProfile}
          onWithdraw={handleWithdraw}
        />
      )}
    </Shell>
  );
};

export default WorkspacePage;

const Shell = styled.div`
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: #f6f7f9;
`;

const Main = styled.main`
  flex: 1;
  min-width: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Toast = styled.div`
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  max-width: 360px;
  padding: 12px 16px;
  border-radius: 9px;
  background: ${(props) => (props.$type === 'error' ? '#c92a2a' : '#212529')};
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.18);
  animation: toast-in 0.18s ease-out;

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
