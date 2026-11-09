import {
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  Compass,
  UserPlus,
  CirclePlus,
  Building2,
} from 'lucide-react';

export const NAV_SECTIONS_BY_ROLE = {
  ADMIN: [
    {
      section: 'Análisis',
      items: [{ path: '/dashboard', label: 'Panel', icon: LayoutDashboard }],
    },
    {
      section: 'Catálogo',
      items: [
        {
          path: '/activities/new',
          label: 'Nueva actividad',
          icon: CirclePlus,
        },
        {
          path: '/admin/activities',
          label: 'Actividades',
          icon: ClipboardList,
          badgeKey: 'closes',
          matches: [
            '/activities/:activityId',
            '/activities/:activityId/edit',
            '/admin/activities/pending-closure',
            '/admin/activities/:activityId/closure',
            '/closures/:closureId',
          ],
        },
        {
          path: '/admin/activities/pending',
          label: 'Solicitudes',
          icon: ClipboardCheck,
          badgeKey: 'requests',
          matches: ['/proposals', '/proposals/:proposalId'],
        },
      ],
    },
    {
      section: 'Participación',
      items: [
        {
          // Apunta a la ruta final y no a `/inscriptions`: con la redirección de
          // por medio el resaltado de activo se perdería.
          path: '/admin/registrations',
          label: 'Inscripciones',
          icon: UserPlus,
          badgeKey: 'inscriptions',
          matches: ['/activities/:activityId/registrations'],
        },
        {
          path: '/admin/account-status',
          label: 'Entidades',
          icon: Building2,
          badgeKey: 'pendingAccounts',
        },
      ],
    },
  ],
  EMPLOYEE: [
    {
      section: 'Voluntariado',
      items: [
        {
          path: '/activities',
          label: 'Explorar',
          icon: Compass,
          matches: ['/activities/:activityId'],
        },
        {
          path: '/my-activities',
          label: 'Mis voluntariados',
          icon: ClipboardList,
          matches: [
            '/my-volunteering',
            '/closures/new',
            '/closures/:closureId',
            '/closures/:closureId/certificate',
          ],
        },
      ],
    },
  ],
  PARTNER: [
    {
      section: 'Análisis',
      items: [{ path: '/org/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
    {
      section: 'Gestión',
      items: [
        // La entidad no publica actividades: propone. Lo que rellena en
        // `/org/activities` es una propuesta de actividad que la Fundación
        // aprueba o devuelve, y solo al aprobarla pasa al catálogo.
        {
          path: '/org/activities/new',
          label: 'Nueva propuesta',
          icon: CirclePlus,
        },
        {
          path: '/org/activities',
          label: 'Mis propuestas',
          icon: ClipboardList,
          matches: ['/org/activities/:activityId/edit'],
        },
      ],
    },
  ],
};
