import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { FaExclamationTriangle, FaRegClock, FaSpinner } from 'react-icons/fa';
import { formatBytes } from '../../utils/requestUtils';

const highlightJson = (json) => {
  const escaped = json
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped.replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g,
    (match) => {
      let className = 'number';
      if (/^"/.test(match)) {
        className = /:$/.test(match) ? 'key' : 'string';
      } else if (/true|false/.test(match)) {
        className = 'boolean';
      } else if (/null/.test(match)) {
        className = 'null';
      }
      return `<span class="j-${className}">${match}</span>`;
    }
  );
};

const getStatusTone = (status) => {
  if (status >= 200 && status < 300) return 'success';
  if (status >= 300 && status < 400) return 'redirect';
  if (status >= 400 && status < 500) return 'client';
  if (status >= 500) return 'server';
  return 'neutral';
};

const ResponsePanel = ({ response, sending }) => {
  const [activeTab, setActiveTab] = useState('body');

  const renderedBody = useMemo(() => {
    if (!response || response.error) return { text: '', isJson: false };

    const raw = typeof response.body === 'string' ? response.body : JSON.stringify(response.body);
    if (!raw) return { text: '', isJson: false };

    try {
      const parsed = JSON.parse(raw);
      return { text: highlightJson(JSON.stringify(parsed, null, 2)), isJson: true };
    } catch {
      return { text: raw, isJson: false };
    }
  }, [response]);

  return (
    <Section>
      <Header>
        <Title>Response</Title>

        {response && !response.error && (
          <Meta>
            <StatusBadge $tone={getStatusTone(response.status)}>
              {response.status} {response.statusText}
            </StatusBadge>
            <MetaItem>
              <FaRegClock />
              {response.time} ms
            </MetaItem>
            <MetaItem>{formatBytes(response.size)}</MetaItem>
          </Meta>
        )}
      </Header>

      {sending ? (
        <CenterState>
          <Spinner>
            <FaSpinner className="spin" />
          </Spinner>
          <StateText>요청을 보내는 중...</StateText>
        </CenterState>
      ) : !response ? (
        <CenterState>
          <EmptyTitle>응답이 여기에 표시됩니다</EmptyTitle>
          <StateText>URL을 입력하고 Send 버튼을 눌러 요청을 실행하세요.</StateText>
        </CenterState>
      ) : response.error ? (
        <CenterState>
          <ErrorIcon>
            <FaExclamationTriangle />
          </ErrorIcon>
          <EmptyTitle>요청을 보내지 못했습니다</EmptyTitle>
          <StateText>{response.message}</StateText>
          <ErrorHint>
            URL, 네트워크 상태, 대상 서버의 응답 가능 여부를 확인해 주세요.
          </ErrorHint>
        </CenterState>
      ) : (
        <>
          <ResponseTabs>
            <ResponseTab
              type="button"
              $active={activeTab === 'body'}
              onClick={() => setActiveTab('body')}
            >
              Body
            </ResponseTab>
            <ResponseTab
              type="button"
              $active={activeTab === 'headers'}
              onClick={() => setActiveTab('headers')}
            >
              Headers
              <TabCount>{response.headers.length}</TabCount>
            </ResponseTab>
          </ResponseTabs>

          <BodyArea>
            {activeTab === 'body' ? (
              renderedBody.text ? (
                <Pre
                  $mono={!renderedBody.isJson}
                  dangerouslySetInnerHTML={{ __html: renderedBody.text }}
                />
              ) : (
                <NoContent>응답 body가 비어 있습니다.</NoContent>
              )
            ) : (
              <HeaderTable>
                <tbody>
                  {response.headers.map(([key, value], index) => (
                    <tr key={`${key}-${index}`}>
                      <th>{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </HeaderTable>
            )}
          </BodyArea>
        </>
      )}
    </Section>
  );
};

export default ResponsePanel;

const Section = styled.section`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  overflow: hidden;
`;

const Header = styled.div`
  min-height: 50px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  border-bottom: 1px solid #ececec;
`;

const Title = styled.h2`
  color: #212529;
  font-size: 13px;
  font-weight: 800;
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
`;

const StatusBadge = styled.span`
  padding: 4px 9px;
  border-radius: 5px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: ${(props) =>
    ({
      success: '#2b8a3e',
      redirect: '#e67700',
      client: '#c92a2a',
      server: '#a61e4d',
      neutral: '#495057',
    })[props.$tone]};
  background: ${(props) =>
    ({
      success: '#ebfbee',
      redirect: '#fff9db',
      client: '#fff5f5',
      server: '#fff0f6',
      neutral: '#f1f3f5',
    })[props.$tone]};
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  color: #868e96;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
`;

const ResponseTabs = styled.div`
  display: flex;
  gap: 4px;
  padding: 0 18px;
  border-bottom: 1px solid #f1f1f1;
`;

const ResponseTab = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: transparent;
  color: ${(props) => (props.$active ? '#212529' : '#868e96')};
  font-size: 11px;
  font-weight: ${(props) => (props.$active ? '800' : '600')};
  border-bottom: 2px solid ${(props) => (props.$active ? '#ff6c37' : 'transparent')};
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
`;

const BodyArea = styled.div`
  flex: 1;
  min-height: 0;
  overflow: auto;
  background: #fcfcfc;
`;

const Pre = styled.pre`
  min-height: 100%;
  margin: 0;
  padding: 16px 18px;
  color: #343a40;
  font-family: ${(props) =>
    props.$mono ? "'Nanum Gothic', sans-serif" : "'JetBrains Mono', 'Consolas', monospace"};
  font-size: 11.5px;
  line-height: 1.75;
  white-space: pre-wrap;
  word-break: break-word;

  .j-key {
    color: #1971c2;
  }

  .j-string {
    color: #2b8a3e;
  }

  .j-number {
    color: #e8590c;
  }

  .j-boolean {
    color: #7048e8;
  }

  .j-null {
    color: #a61e4d;
  }
`;

const HeaderTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: 9px 18px;
    border-bottom: 1px solid #f1f3f5;
    text-align: left;
    vertical-align: top;
    font-size: 11px;
    line-height: 1.5;
  }

  th {
    width: 260px;
    color: #495057;
    font-family: 'JetBrains Mono', monospace;
    font-weight: 600;
  }

  td {
    color: #868e96;
    font-family: 'JetBrains Mono', monospace;
    word-break: break-all;
  }
`;

const CenterState = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
  text-align: center;
  background:
    radial-gradient(circle at 50% 42%, #fff8f4 0, transparent 45%),
    #fcfcfc;
`;

const EmptyTitle = styled.h3`
  color: #495057;
  font-size: 13px;
  font-weight: 800;
`;

const StateText = styled.p`
  margin-top: 7px;
  max-width: 420px;
  color: #9a9a9a;
  font-size: 11px;
  line-height: 1.6;
`;

const ErrorIcon = styled.div`
  width: 42px;
  height: 42px;
  margin-bottom: 14px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #fff5f5;
  color: #e03131;
  font-size: 16px;
`;

const ErrorHint = styled.p`
  margin-top: 12px;
  padding: 7px 10px;
  border-radius: 6px;
  background: #f8f9fa;
  color: #adb5bd;
  font-size: 10px;
`;

const Spinner = styled.div`
  margin-bottom: 14px;
  color: #ff6c37;
  font-size: 22px;
`;

const NoContent = styled.p`
  padding: 30px 18px;
  color: #adb5bd;
  font-size: 11px;
`;
