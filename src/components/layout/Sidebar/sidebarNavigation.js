import {
  LayoutDashboard,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Compass,
  UserPlus,
  CheckCircle2,
  CirclePlus,
  BarChart3,
  Building2,
} from "lucide-react";

export const NAV_SECTIONS_BY_ROLE = {
  ADMIN: [
    {
      section: "Análisis",
      items: [
        { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      section: "Catálogo",
      items: [
        {
          path: "/activities/new",
          label: "Nuevo proyecto",
          icon: CirclePlus,
        },
        {
          path: "/admin/activities",
          label: "Proyectos",
          icon: ClipboardList,
          matches: ["/activities/:activityId", "/activities/:activityId/edit"],
        },
        {
          path: "/proposals",
          label: "Propuestas",
          icon: FileText,
          matches: ["/proposals/:proposalId"],
        },
        {
          path: "/admin/activities/pending",
          label: "En revisión",
          icon: ClipboardCheck,
          badgeKey: "pendingReview",
        },
      ],
    },
    {
      section: "Entidades",
      items: [
        {
          path: "/admin/account-status",
          label: "Solicitudes pendientes",
          icon: Building2,
          badgeKey: "pendingAccounts",
        },
      ],
    },
    {
      section: "Participación",
      items: [
        {
          // Apunta a la ruta final y no a `/inscriptions`: con la redirección de
          // por medio el resaltado de activo se perdería.
          path: "/admin/registrations",
          label: "Inscripciones",
          icon: UserPlus,
          badgeKey: "inscriptions",
          matches: ["/activities/:activityId/registrations"],
        },
        {
          path: "/admin/activities/pending-closure",
          label: "Cierres",
          icon: CheckCircle2,
          badgeKey: "closes",
          matches: ["/admin/activities/:activityId/closure", "/closures/:closureId"],
        },
      ],
    },
  ],
  EMPLOYEE: [
    {
      section: "Voluntariado",
      items: [
        {
          path: "/activities",
          label: "Explorar",
          icon: Compass,
          matches: ["/activities/:activityId"],
        },
        {
          path: "/my-activities",
          label: "Mis voluntariados",
          icon: ClipboardList,
          matches: [
            "/my-volunteering",
            "/closures/new",
            "/closures/:closureId",
            "/closures/:closureId/certificate",
          ],
        },
      ],
    },
  ],
  PARTNER: [
    {
      section: "Análisis",
      items: [
        { path: "/org/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ],
    },
    {
      section: "Gestión",
      items: [
        // La entidad no publica actividades: propone. Lo que rellena en
        // `/org/activities` es una propuesta de actividad que la Fundación
        // aprueba o devuelve, y solo al aprobarla pasa al catálogo.
        {
          path: "/org/activities/new",
          label: "Nueva propuesta",
          icon: CirclePlus,
        },
        {
          path: "/org/activities",
          label: "Mis propuestas",
          icon: ClipboardList,
          matches: ["/org/activities/:activityId/edit"],
        },
      ],
    },
  ],
};
