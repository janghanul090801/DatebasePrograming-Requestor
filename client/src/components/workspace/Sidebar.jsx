import { useMemo, useState } from 'react';
import styled from 'styled-components';
import {
  FaBolt,
  FaChevronLeft,
  FaPlus,
  FaSearch,
  FaSignOutAlt,
  FaTrashAlt,
  FaUserCog,
} from 'react-icons/fa';
import { formatDate, METHOD_COLORS } from '../../utils/requestUtils';

const OVERVIEW_METHODS = [
  { key: 'getCount', method: 'GET' },
  { key: 'postCount', method: 'POST' },
  { key: 'putCount', method: 'PUT' },
  { key: 'deleteCount', method: 'DELETE' },
];

const Sidebar = ({
  requests,
  activeId,
  loading,
  userEmail,
  overview,
  topEndpoints,
  onCreate,
  onSelect,
  onDelete,
  onLogout,
  onOpenProfile,
  onCollapse,
}) => {
  const [keyword, setKeyword] = useState('');

  const stats = overview?.stats;
  const displayName = overview?.user?.nickname || userEmail;

  const filteredRequests = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) return requests;

    return requests.filter((request) => {
      return (
        request.name?.toLowerCase().includes(normalized) ||
        request.url?.toLowerCase().includes(normalized) ||
        request.method?.toLowerCase().includes(normalized)
      );
    });
  }, [requests, keyword]);

  return (
    <Aside>
      <BrandRow>
        <Brand>
          <BrandMark>
            <FaBolt />
          </BrandMark>
          <BrandText>requestor</BrandText>
        </Brand>
        <CollapseButton onClick={onCollapse} title="사이드바 접기">
          <FaChevronLeft />
        </CollapseButton>
      </BrandRow>

      <NewRequestButton onClick={onCreate}>
        <FaPlus />
        New Request
      </NewRequestButton>

      <SearchBox>
        <FaSearch />
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="요청 검색"
          aria-label="저장된 요청 검색"
        />
        {keyword && (
          <ClearButton type="button" onClick={() => setKeyword('')} aria-label="검색어 지우기">
            ×
          </ClearButton>
        )}
      </SearchBox>

      <SectionHeader>
        <span>My Requests</span>
        <Count>{requests.length}</Count>
      </SectionHeader>

      <RequestList>
        {loading ? (
          <Hint>요청을 불러오는 중...</Hint>
        ) : filteredRequests.length === 0 ? (
          <EmptyBox>
            <EmptyTitle>{requests.length === 0 ? '아직 저장된 요청이 없어요' : '검색 결과가 없어요'}</EmptyTitle>
            <EmptyText>
              {requests.length === 0
                ? '요청을 작성하고 Save 버튼을 눌러보세요.'
                : '다른 검색어로 다시 시도해 보세요.'}
            </EmptyText>
          </EmptyBox>
        ) : (
          filteredRequests.map((request) => (
            <RequestItem
              key={request.id}
              type="button"
              $active={request.id === activeId}
              onClick={() => onSelect(request.id)}
            >
              <MethodBadge $method={request.method}>{request.method}</MethodBadge>
              <ItemBody>
                <ItemName>{request.name || 'Untitled Request'}</ItemName>
                <ItemUrl>{request.url || 'URL 없음'}</ItemUrl>
                <ItemDate>{formatDate(request.updatedAt)}</ItemDate>
              </ItemBody>
              <DeleteButton
                className="delete-request"
                role="button"
                title="요청 삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(request.id);
                }}
              >
                <FaTrashAlt />
              </DeleteButton>
            </RequestItem>
          ))
        )}
      </RequestList>

      <OverviewCard>
        <OverviewHead>
          <span>Workspace stats</span>
          <span>{stats?.requestCount ?? 0} requests</span>
        </OverviewHead>
        <OverviewTotal>
          <strong>{stats?.requestCount ?? 0}</strong>
          <span>saved requests</span>
        </OverviewTotal>
        <MethodGrid>
          {OVERVIEW_METHODS.map(({ key, method }) => (
            <MethodStat key={method}>
              <MethodStatLabel $method={method}>{method}</MethodStatLabel>
              <MethodStatValue>{stats?.[key] ?? 0}</MethodStatValue>
            </MethodStat>
          ))}
        </MethodGrid>
        <OverviewFooter>
          <span>Last activity</span>
          <span>{stats?.lastRequestAt ? formatDate(stats.lastRequestAt) : '—'}</span>
        </OverviewFooter>
      </OverviewCard>

      <TopEndpointsCard>
        <OverviewHead>
          <span>Top endpoints</span>
          <span>{topEndpoints.length} URLs</span>
        </OverviewHead>
        {topEndpoints.length === 0 ? (
          <TopEndpointEmpty>저장된 요청 URL이 없습니다.</TopEndpointEmpty>
        ) : (
          <EndpointList>
            {topEndpoints.map((endpoint, index) => (
              <EndpointRow key={`${endpoint.url}-${index}`} title={endpoint.url}>
                <EndpointRank>{index + 1}</EndpointRank>
                <EndpointUrl>{endpoint.url}</EndpointUrl>
                <EndpointCount>{endpoint.requestCount}</EndpointCount>
              </EndpointRow>
            ))}
          </EndpointList>
        )}
      </TopEndpointsCard>

      <UserBox>
        <Avatar>{(displayName || 'U').charAt(0).toUpperCase()}</Avatar>
        <UserInfo>
          <UserName title={overview?.user?.email || userEmail}>
            {displayName || '내 워크스페이스'}
          </UserName>
          <UserRole>{overview?.user?.email || 'Personal workspace'}</UserRole>
        </UserInfo>
        <ProfileButton
          type="button"
          onClick={onOpenProfile}
          title="계정 관리 (프로필 수정 / 회원 탈퇴)"
        >
          <FaUserCog />
        </ProfileButton>
        <LogoutButton type="button" onClick={onLogout} title="로그아웃">
          <FaSignOutAlt />
        </LogoutButton>
      </UserBox>
    </Aside>
  );
};

export default Sidebar;

const Aside = styled.aside`
  width: 284px;
  flex-shrink: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #1c1c1c;
  color: #e9e9e9;
  border-right: 1px solid #2c2c2c;

  @media (max-width: 760px) {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 30;
    box-shadow: 18px 0 50px rgba(0, 0, 0, 0.35);
  }
`;

const BrandRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 14px;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
`;

const BrandMark = styled.span`
  width: 28px;
  height: 28px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: #ff6c37;
  color: #1c1c1c;
  font-size: 13px;
`;

const BrandText = styled.span`
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -0.03em;
`;

const CollapseButton = styled.button`
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: transparent;
  color: #8f8f8f;
  font-size: 11px;

  &:hover {
    background: #2c2c2c;
    color: #fff;
  }
`;

const NewRequestButton = styled.button`
  margin: 0 14px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 8px;
  background: #ff6c37;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  transition: background 0.15s;

  &:hover {
    background: #e85a28;
  }
`;

const SearchBox = styled.div`
  margin: 14px 14px 8px;
  height: 34px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  border-radius: 7px;
  background: #262626;
  border: 1px solid #333;
  color: #777;
  font-size: 11px;

  &:focus-within {
    border-color: #ff6c37;
  }

  input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: none;
    outline: none;
    color: #efefef;
    font-size: 12px;

    &::placeholder {
      color: #707070;
    }
  }
`;

const ClearButton = styled.button`
  background: none;
  color: #888;
  font-size: 15px;
  line-height: 1;
  padding: 0 2px;

  &:hover {
    color: #fff;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px 8px;
  color: #8b8b8b;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
`;

const Count = styled.span`
  min-width: 20px;
  height: 18px;
  padding: 0 6px;
  border-radius: 9px;
  display: grid;
  place-items: center;
  background: #2c2c2c;
  color: #b7b7b7;
  font-size: 10px;
  letter-spacing: 0;
`;

const RequestList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 12px;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: #363636;
    border-radius: 4px;
  }
`;

const RequestItem = styled.button`
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 8px;
  background: ${(props) => (props.$active ? '#2f2f2f' : 'transparent')};
  text-align: left;
  transition: background 0.12s;

  &:hover {
    background: ${(props) => (props.$active ? '#363636' : '#262626')};
  }

  &:hover .delete-request {
    opacity: 1;
  }
`;

const MethodBadge = styled.span`
  margin-top: 2px;
  min-width: 44px;
  padding: 3px 5px;
  border-radius: 4px;
  text-align: center;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${(props) => METHOD_COLORS[props.$method] ?? '#868e96'};
  background: ${(props) => `${METHOD_COLORS[props.$method] ?? '#868e96'}1f`};
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const ItemName = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #e7e7e7;
  font-size: 12px;
  font-weight: 600;
`;

const ItemUrl = styled.p`
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #7c7c7c;
  font-size: 10px;
`;

const ItemDate = styled.p`
  margin-top: 3px;
  color: #5f5f5f;
  font-size: 9px;
`;

const DeleteButton = styled.span`
  opacity: 0;
  flex-shrink: 0;
  padding: 4px;
  border-radius: 4px;
  color: #8f8f8f;
  font-size: 10px;
  transition: opacity 0.12s, color 0.12s;

  &:hover {
    color: #ff8787;
    background: #3a2626;
  }
`;

const Hint = styled.p`
  padding: 18px 12px;
  color: #777;
  font-size: 11px;
  text-align: center;
`;

const EmptyBox = styled.div`
  margin: 8px;
  padding: 20px 14px;
  border: 1px dashed #383838;
  border-radius: 8px;
  text-align: center;
`;

const EmptyTitle = styled.p`
  color: #bdbdbd;
  font-size: 11px;
  font-weight: 700;
`;

const EmptyText = styled.p`
  margin-top: 6px;
  color: #6f6f6f;
  font-size: 10px;
  line-height: 1.6;
`;

const OverviewCard = styled.div`
  margin: 0 14px 12px;
  padding: 12px;
  border: 1px solid #303030;
  border-radius: 10px;
  background: linear-gradient(160deg, #262626 0%, #202020 100%);
`;

const OverviewHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #8b8b8b;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;

  span:last-child {
    color: #ffb59b;
    letter-spacing: 0;
    text-transform: none;
  }
`;

const OverviewTotal = styled.div`
  display: flex;
  align-items: baseline;
  gap: 7px;
  margin: 8px 0 10px;

  strong {
    color: #ff6c37;
    font-size: 24px;
    font-weight: 800;
    line-height: 1;
  }

  span {
    color: #777;
    font-size: 10px;
  }
`;

const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
`;

const MethodStat = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 7px;
  border-radius: 5px;
  background: #2b2b2b;
`;

const MethodStatLabel = styled.span`
  font-family: 'JetBrains Mono', monospace;
  font-size: 8px;
  font-weight: 800;
  color: ${(props) => METHOD_COLORS[props.$method] ?? '#868e96'};
`;

const MethodStatValue = styled.span`
  color: #d9d9d9;
  font-size: 10px;
  font-weight: 700;
`;

const OverviewFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 9px;
  padding-top: 8px;
  border-top: 1px solid #303030;
  color: #6d6d6d;
  font-size: 9px;

  span:last-child {
    color: #a5a5a5;
  }
`;

const TopEndpointsCard = styled.div`
  margin: 0 14px 12px;
  padding: 11px 12px;
  border: 1px solid #303030;
  border-radius: 10px;
  background: #202020;
`;

const EndpointList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  margin-top: 9px;
`;

const EndpointRow = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
`;

const EndpointRank = styled.span`
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border-radius: 4px;
  background: #2f2f2f;
  color: #ffb59b;
  font-size: 8px;
  font-weight: 800;
`;

const EndpointUrl = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #bdbdbd;
  font-family: 'JetBrains Mono', monospace;
  font-size: 9px;
`;

const EndpointCount = styled.span`
  flex-shrink: 0;
  color: #ff6c37;
  font-size: 9px;
  font-weight: 800;
`;

const TopEndpointEmpty = styled.p`
  padding: 12px 0 4px;
  color: #6f6f6f;
  font-size: 10px;
  text-align: center;
`;

const UserBox = styled.div`
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 13px 14px;
  border-top: 1px solid #2c2c2c;
  background: #191919;
`;

const Avatar = styled.span`
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #333;
  color: #ffb59b;
  font-size: 12px;
  font-weight: 800;
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const UserName = styled.p`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #d7d7d7;
  font-size: 11px;
  font-weight: 600;
`;

const UserRole = styled.p`
  margin-top: 2px;
  color: #666;
  font-size: 9px;
`;

const LogoutButton = styled.button`
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: transparent;
  color: #7f7f7f;
  font-size: 12px;

  &:hover {
    background: #2c2c2c;
    color: #ff8787;
  }
`;

const ProfileButton = styled.button`
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 6px;
  background: transparent;
  color: #7f7f7f;
  font-size: 12px;

  &:hover {
    background: #2c2c2c;
    color: #ffb59b;
  }
`;
