export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// Swagger/Postman 스타일 메서드 색상
export const METHOD_COLORS = {
  GET: '#2f9e44',
  POST: '#f08c00',
  PUT: '#1971c2',
  PATCH: '#7048e8',
  DELETE: '#e03131',
  HEAD: '#9c36b5',
  OPTIONS: '#0c8599',
};

export const createEmptyRequest = () => ({
  id: null,
  name: 'Untitled Request',
  method: 'GET',
  url: '',
  headers: [],
  queryParams: [],
  body: '',
  bodyType: 'none',
});

const decodePart = (value) => {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
};

// URL의 쿼리스트링을 key/value 행으로 변환
export const parseQueryParams = (url) => {
  const [withoutHash] = String(url ?? '').split('#');
  const queryIndex = withoutHash.indexOf('?');

  if (queryIndex === -1) return [];

  return withoutHash
    .slice(queryIndex + 1)
    .split('&')
    .filter(Boolean)
    .map((part) => {
      const equalIndex = part.indexOf('=');
      return {
        key: decodePart(equalIndex === -1 ? part : part.slice(0, equalIndex)),
        value: equalIndex === -1 ? '' : decodePart(part.slice(equalIndex + 1)),
        description: '',
        enabled: true,
      };
    });
};

// key/value 행을 URL의 쿼리스트링으로 반영
export const buildUrl = (url, params) => {
  const raw = String(url ?? '');
  const hashIndex = raw.indexOf('#');
  const withoutHash = hashIndex === -1 ? raw : raw.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : raw.slice(hashIndex);
  const path = withoutHash.split('?')[0];

  const search = new URLSearchParams();
  (params ?? [])
    .filter((param) => param.enabled !== false && String(param.key ?? '').trim() !== '')
    .forEach((param) => search.append(String(param.key).trim(), String(param.value ?? '')));

  const query = search.toString();
  return `${path}${query ? `?${query}` : ''}${hash}`;
};

// 프로토콜이 없으면 https:// 를 붙이고, /로 시작하는 상대 경로는 그대로 사용
export const normalizeRequestUrl = (url) => {
  const trimmed = String(url ?? '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return `https://${trimmed}`;
};

export const formatBytes = (bytes) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
