// AuthResponse / UserResponse fixtures — backend v2 contract (#117)
// No Enrollment, no /api/enrollments

export const Role = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
  ORG: 'ORG',
};

export const UserStatus = {
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  REJECTED: 'REJECTED',
};

export const MOCK_USERS_V2 = {
  admin: {
    id: 1,
    name: 'Admin Verisure',
    email: 'admin@verisure.com',
    role: Role.ADMIN,
    department: 'Tecnología',
    organization: 'VERISURE_ES',
    status: UserStatus.ACTIVE,
  },
  empleado: {
    id: 2,
    name: 'Elena Empleada',
    email: 'empleado@verisure.com',
    role: Role.EMPLOYEE,
    department: 'Marketing',
    organization: 'VERISURE_ES',
    status: UserStatus.ACTIVE,
  },
  orgActive: {
    id: 3,
    name: 'Fundación Social',
    email: 'ong@fundacion.org',
    role: Role.ORG,
    department: null,
    organization: null,
    status: UserStatus.ACTIVE,
  },
  orgPendingVerification: {
    id: 4,
    name: 'Entidad Pendiente Verificación',
    email: 'pendiente-verificacion@entidad.org',
    role: Role.ORG,
    department: null,
    organization: null,
    status: UserStatus.PENDING_VERIFICATION,
  },
  orgPendingApproval: {
    id: 5,
    name: 'Entidad Pendiente Aprobación',
    email: 'pendiente@entidad.org',
    role: Role.ORG,
    department: null,
    organization: null,
    status: UserStatus.PENDING_APPROVAL,
  },
  orgRejected: {
    id: 6,
    name: 'Entidad Rechazada',
    email: 'rechazada@entidad.org',
    role: Role.ORG,
    department: null,
    organization: null,
    status: UserStatus.REJECTED,
  },
};

export function makeUser(overrides = {}) {
  return {
    id: 100,
    name: 'Test User',
    email: 'test@verisure.com',
    role: Role.EMPLOYEE,
    department: 'Test',
    organization: 'VERISURE_ES',
    status: UserStatus.ACTIVE,
    ...overrides,
  };
}

export function makeAuthResponse(user = MOCK_USERS_V2.empleado, overrides = {}) {
  return {
    accessToken: `mock-token-${user.id}`,
    tokenType: 'Bearer',
    expiresIn: 7200,
    user,
    ...overrides,
  };
}

export function makeLoginSuccess(userKey = 'empleado') {
  const user = MOCK_USERS_V2[userKey] ?? MOCK_USERS_V2.empleado;
  return { data: makeAuthResponse(user) };
}

// Helper to simulate login error mapping (401 vs 403 variants)
export function loginErrorForStatus(status) {
  const map = {
    PENDING_VERIFICATION: { status: 403, code: 'ACCOUNT_NOT_VERIFIED' },
    PENDING_APPROVAL: { status: 403, code: 'ACCOUNT_PENDING_APPROVAL' },
    REJECTED: { status: 403, code: 'ACCOUNT_REJECTED' },
  };
  return map[status] ?? { status: 401, code: null };
}
