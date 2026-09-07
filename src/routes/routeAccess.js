export const ROLE_HOME_PATHS = {
  ADMIN: '/dashboard',
  EMPLOYEE: '/activities',
  ORG: '/org/activities',
  PARTNER: '/org/activities',
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] ?? '/';
}
