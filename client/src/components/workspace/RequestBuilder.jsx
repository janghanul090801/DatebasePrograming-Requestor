import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  FaBars,
  FaCheckCircle,
  FaExclamationCircle,
  FaPlay,
  FaSave,
  FaSpinner,
  FaUser,
} from 'react-icons/fa';
import KeyValueEditor from './KeyValueEditor';
import {
  buildUrl,
  HTTP_METHODS,
  METHOD_COLORS,
  parseQueryParams,
} from '../../utils/requestUtils';

const TABS = [
  { id: 'params', label: 'Params' },
  { id: 'headers', label: 'Headers' },
  { id: 'body', label: 'Body' },
];

const BODY_TYPES = [
  { id: 'none', label: 'None' },
  { id: 'json', label: 'JSON' },
  { id: 'text', label: 'Text' },
];

const RequestBuilder = ({
  request,
  author,
  dirty,
  saving,
  sending,
  sidebarOpen,
  onChange,
  onSave,
  onSend,
  onOpenSidebar,
}) => {
  const [activeTab, setActiveTab] = useState('params');

  const enabledParams = request.queryParams.filter(
    (param) => param.enabled !== false && String(param.key ?? '').trim() !== ''
  ).length;

  const enabledHeaders = request.headers.filter(
    (header) => header.enabled !== false && String(header.key ?? '').trim() !== ''
  ).length;

  const jsonError = useMemo(() => {
    if (request.bodyType !== 'json' || !request.body.trim()) return '';
    try {
      JSON.parse(request.body);
      return '';
    } catch (error) {
      return error.message;
    }
  }, [request.body, request.bodyType]);

  const handleUrlChange = (value) => {
    onChange({ url: value, queryParams: parseQueryParams(value) });
  };

  const handleParamsChange = (rows) => {
    onChange({ queryParams: rows, url: buildUrl(request.url, rows) });
  };

  const handleFormatBody = () => {
    try {
      const parsed = JSON.parse(request.body);
      onChange({ body: JSON.stringify(parsed, null, 2) });
    } catch {
      // 유효하지 않은 JSON은 그대로 둔다.
    }
  };

  return (
    <Builder>
      <TopBar>
        <TopBarLeft>
          {!sidebarOpen && (
            <IconButton type="button" onClick={onOpenSidebar} title="사이드바 열기">
              <FaBars />
            </IconButton>
          )}
          <NameInput
            value={request.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Untitled Request"
            aria-label="요청 이름"
          />
          {dirty ? (
            <DirtyHint>
              <FaExclamationCircle />
              저장되지 않음
            </DirtyHint>
          ) : request.id ? (
            <SavedHint>
              <FaCheckCircle />
              저장됨
            </SavedHint>
          ) : null}
          {request.id && author && (
            <AuthorHint title={author.email || ''}>
              <FaUser />
              {author.nickname || author.email}
            </AuthorHint>
          )}
        </TopBarLeft>

        <SaveButton
          type="button"
          onClick={onSave}
          disabled={saving || (!dirty && Boolean(request.id))}
        >
          {saving ? <FaSpinner className="spin" /> : <FaSave />}
          {saving ? 'Saving' : 'Save'}
        </SaveButton>
      </TopBar>

      <UrlRow>
        <MethodSelect
          $method={request.method}
          value={request.method}
          onChange={(e) => onChange({ method: e.target.value })}
          aria-label="HTTP 메서드"
        >
          {HTTP_METHODS.map((method) => (
            <option key={method} value={method}>
              {method}
            </option>
          ))}
        </MethodSelect>

        <UrlInput
          value={request.url}
          onChange={(e) => handleUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !sending) onSend();
          }}
          placeholder="https://api.example.com/users 또는 /api/requests"
          spellCheck={false}
          aria-label="요청 URL"
        />

        <SendButton type="button" onClick={onSend} disabled={sending}>
          {sending ? <FaSpinner className="spin" /> : <FaPlay />}
          {sending ? 'Sending' : 'Send'}
        </SendButton>
      </UrlRow>

      <TabBar>
        {TABS.map((tab) => {
          const count =
            tab.id === 'params'
              ? enabledParams
              : tab.id === 'headers'
                ? enabledHeaders
                : request.bodyType !== 'none'
                  ? 1
                  : 0;

          return (
            <TabButton
              key={tab.id}
              type="button"
              $active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {count > 0 && <TabCount>{count}</TabCount>}
            </TabButton>
          );
        })}
      </TabBar>

      <Panel>
        {activeTab === 'params' && (
          <PanelInner>
            <PanelHint>
              URL에 포함된 쿼리 파라미터입니다. 행을 수정하면 URL에 바로 반영됩니다.
            </PanelHint>
            <KeyValueEditor
              rows={request.queryParams}
              onChange={handleParamsChange}
              keyPlaceholder="key"
              valuePlaceholder="value"
              descriptionPlaceholder="설명 (선택)"
              emptyText="쿼리 파라미터가 없습니다. Add row로 추가해 보세요."
            />
          </PanelInner>
        )}

        {activeTab === 'headers' && (
          <PanelInner>
            <PanelHint>요청과 함께 전송할 HTTP 헤더를 입력하세요.</PanelHint>
            <KeyValueEditor
              rows={request.headers}
              onChange={(rows) => onChange({ headers: rows })}
              keyPlaceholder="Content-Type"
              valuePlaceholder="application/json"
              descriptionPlaceholder="설명 (선택)"
              emptyText="헤더가 없습니다. Add row로 추가해 보세요."
            />
          </PanelInner>
        )}

        {activeTab === 'body' && (
          <PanelInner>
            <BodyToolbar>
              <SegmentedControl>
                {BODY_TYPES.map((type) => (
                  <SegmentButton
                    key={type.id}
                    type="button"
                    $active={request.bodyType === type.id}
                    onClick={() => onChange({ bodyType: type.id })}
                  >
                    {type.label}
                  </SegmentButton>
                ))}
              </SegmentedControl>

              {request.bodyType === 'json' && (
                <FormatButton type="button" onClick={handleFormatBody}>
                  Beautify
                </FormatButton>
              )}
            </BodyToolbar>

            {request.bodyType === 'none' ? (
              <BodyEmpty>
                이 요청은 body를 사용하지 않습니다. JSON 또는 Text를 선택해 내용을 작성하세요.
              </BodyEmpty>
            ) : (
              <>
                <BodyTextarea
                  value={request.body}
                  onChange={(e) => onChange({ body: e.target.value })}
                  placeholder={
                    request.bodyType === 'json'
                      ? '{\n  "name": "requestor"\n}'
                      : '요청 body를 입력하세요.'
                  }
                  spellCheck={false}
                />
                {request.bodyType === 'json' && request.body.trim() && (
                  <JsonStatus $error={Boolean(jsonError)}>
                    {jsonError ? (
                      <>
                        <FaExclamationCircle /> {jsonError}
                      </>
                    ) : (
                      <>
                        <FaCheckCircle /> 유효한 JSON입니다.
                      </>
                    )}
                  </JsonStatus>
                )}
              </>
            )}
          </PanelInner>
        )}
      </Panel>
    </Builder>
  );
};

export default RequestBuilder;

const Builder = styled.section`
  display: flex;
  flex-direction: column;
  background: #fff;
  border-bottom: 1px solid #e5e5e5;
  flex-shrink: 0;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 18px 8px;
`;

const TopBarLeft = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const IconButton = styled.button`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: #f1f3f5;
  color: #495057;
  font-size: 12px;

  &:hover {
    background: #e9ecef;
  }
`;

const NameInput = styled.input`
  width: 100%;
  max-width: 520px;
  min-width: 0;
  padding: 4px 6px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #212529;
  font-size: 15px;
  font-weight: 700;
  outline: none;

  &:hover {
    background: #f8f9fa;
  }

  &:focus {
    background: #fff;
    border-color: #ffc9b8;
    box-shadow: 0 0 0 3px rgba(255, 108, 55, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const DirtyHint = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #e8590c;
  font-size: 10px;
  font-weight: 600;
`;

const SavedHint = styled.span`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  color: #2f9e44;
  font-size: 10px;
  font-weight: 600;
`;

const AuthorHint = styled.span`
  max-width: 180px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 5px;
  overflow: hidden;
  padding: 3px 8px;
  border-radius: 999px;
  background: #f1f3f5;
  color: #6c757d;
  font-size: 10px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;

  svg {
    flex-shrink: 0;
    color: #ff6c37;
  }
`;

const SaveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 7px;
  background: #fff;
  color: #343a40;
  font-size: 12px;
  font-weight: 700;
  transition: background 0.15s, border-color 0.15s;

  &:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #ff6c37;
    color: #e85a28;
  }

  &:disabled {
    color: #b1b1b1;
    cursor: not-allowed;
    background: #fbfbfb;
  }
`;

const UrlRow = styled.div`
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 6px 18px 12px;
`;

const MethodSelect = styled.select`
  width: 104px;
  flex-shrink: 0;
  padding: 0 8px;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  background: #fff;
  color: ${(props) => METHOD_COLORS[props.$method] ?? '#343a40'};
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 800;
  outline: none;
  cursor: pointer;

  &:focus {
    border-color: #ff6c37;
  }
`;

const UrlInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 11px 13px;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  background: #fafafa;
  color: #212529;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s, background 0.15s;

  &:focus {
    background: #fff;
    border-color: #ff6c37;
    box-shadow: 0 0 0 3px rgba(255, 108, 55, 0.1);
  }

  &::placeholder {
    color: #a3a3a3;
    font-family: 'Nanum Gothic', sans-serif;
  }
`;

const SendButton = styled.button`
  min-width: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 7px;
  background: #ff6c37;
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #e85a28;
  }

  &:disabled {
    background: #ffb59b;
    cursor: not-allowed;
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 18px;
  border-bottom: 1px solid #ececec;
`;

const TabButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 11px 13px;
  background: transparent;
  color: ${(props) => (props.$active ? '#212529' : '#868e96')};
  font-size: 12px;
  font-weight: ${(props) => (props.$active ? '800' : '600')};
  border-bottom: 2px solid ${(props) => (props.$active ? '#ff6c37' : 'transparent')};

  &:hover {
    color: #212529;
  }
`;

const TabCount = styled.span`
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: #f1f3f5;
  color: #868e96;
  font-size: 9px;
  font-weight: 700;
`;

const Panel = styled.div`
  max-height: 300px;
  overflow-y: auto;
  background: #fff;
`;

const PanelInner = styled.div`
  padding: 14px 18px 18px;
`;

const PanelHint = styled.p`
  margin-bottom: 8px;
  color: #9a9a9a;
  font-size: 10px;
`;

const BodyToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
`;

const SegmentedControl = styled.div`
  display: inline-flex;
  padding: 3px;
  border-radius: 7px;
  background: #f1f3f5;
`;

const SegmentButton = styled.button`
  padding: 6px 12px;
  border-radius: 5px;
  background: ${(props) => (props.$active ? '#fff' : 'transparent')};
  color: ${(props) => (props.$active ? '#e85a28' : '#868e96')};
  font-size: 11px;
  font-weight: 700;
  box-shadow: ${(props) => (props.$active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none')};
`;

const FormatButton = styled.button`
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 5px;
  background: #fff;
  color: #6c757d;
  font-size: 10px;
  font-weight: 700;

  &:hover {
    border-color: #ff6c37;
    color: #e85a28;
  }
`;

const BodyTextarea = styled.textarea`
  width: 100%;
  min-height: 150px;
  resize: vertical;
  padding: 13px;
  border: 1px solid #e0e0e0;
  border-radius: 7px;
  background: #fafafa;
  color: #212529;
  font-family: 'JetBrains Mono', 'Consolas', monospace;
  font-size: 11.5px;
  line-height: 1.7;
  outline: none;

  &:focus {
    background: #fff;
    border-color: #ff6c37;
    box-shadow: 0 0 0 3px rgba(255, 108, 55, 0.1);
  }

  &::placeholder {
    color: #adb5bd;
  }
`;

const JsonStatus = styled.p`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 7px;
  color: ${(props) => (props.$error ? '#e03131' : '#2f9e44')};
  font-size: 10px;
`;

const BodyEmpty = styled.p`
  padding: 28px 14px;
  border: 1px dashed #e0e0e0;
  border-radius: 8px;
  color: #9a9a9a;
  font-size: 11px;
  text-align: center;
`;
