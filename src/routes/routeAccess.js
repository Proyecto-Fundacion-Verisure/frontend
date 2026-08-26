export const ROLE_HOME_PATHS = {
  ADMIN: '/dashboard',
  EMPLOYEE: '/activities',
  ORG: '/org/activities',
};

export function getRoleHomePath(role) {
  return ROLE_HOME_PATHS[role] ?? '/';
}

export function requiresAccountStatus(user) {
  return user?.role === 'ORG' && user.status !== 'ACTIVE';
}
