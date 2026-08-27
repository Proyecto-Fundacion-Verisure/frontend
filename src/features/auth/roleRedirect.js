const ROLE_HOME_ROUTES = {
  admin: '/admin/dashboard',
  ong: '/organization/dashboard',
  employee: '/voluntier/explore',
};

export function getRoleHomeRoute(role) {
  return ROLE_HOME_ROUTES[role] ?? '/';
}