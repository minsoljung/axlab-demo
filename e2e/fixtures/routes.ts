// 경로 상수 한 곳. 공통 계약에 없는 값은 가정이라 계약 공백으로 회수에 적었다. developer 와 다르면 여기만 고친다.
export const ADMIN_CODE = 'test-admin-code';

export const routes = {
  hub: '/',
  detail: (id: string | number) => `/events/${id}`,
  apply: (id: string | number) => `/events/${id}/apply`,
  admin: '/admin',
  adminList: '/admin/events',
  adminNew: '/admin/events/new',
  adminEdit: (id: string | number) => `/admin/events/${id}/edit`,
};

export const api = {
  events: '/api/events',
  event: (id: string | number) => `/api/events/${id}`,
  applications: (id: string | number) => `/api/events/${id}/applications`,
  adminEvents: '/api/admin/events',
  adminEvent: (id: string | number) => `/api/admin/events/${id}`,
  adminClose: (id: string | number) => `/api/admin/events/${id}/close`,
};

export const urlEndsWith = (path: string) =>
  new RegExp(path.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&') + '/?(\\?.*)?$');
