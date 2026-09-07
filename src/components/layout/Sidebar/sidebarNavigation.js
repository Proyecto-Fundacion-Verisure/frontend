import {
  LayoutDashboard,
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
          label: "Crear actividad",
          icon: CirclePlus,
          variant: "cta",
        },
        { path: "/admin/activities", label: "Actividades", icon: ClipboardList },
        {
          path: "/proposals",
          label: "Propuestas",
          icon: FileText,
          badgeKey: "proposals",
        },
      ],
    },
    {
      section: "Participación",
      items: [
        {
          path: "/admin/activities",
          label: "Inscripciones",
          icon: UserPlus,
          badgeKey: "inscriptions",
        },
        {
          path: "/reports/pending",
          label: "Cierres",
          icon: CheckCircle2,
          badgeKey: "closes",
        },
      ],
    },
    {
      section: "Entidades",
      items: [
        {
          path: "/admin/account-status",
          label: "Cuentas pendientes",
          icon: Building2,
          badgeKey: "pendingAccounts",
        },
      ],
    },
  ],
  EMPLOYEE: [
    {
      section: "Voluntariado",
      items: [
        { path: "/activities", label: "Explorar", icon: Compass },
        {
          path: "/my-activities",
          label: "Mis voluntariados",
          icon: ClipboardList,
        },
      ],
    },
  ],
  ORG: [
    {
      section: "Gestión",
      items: [
        {
          path: "/org/activities",
          label: "Mis actividades",
          icon: ClipboardList,
        },
        {
          path: "/org/reports",
          label: "Informes",
          icon: BarChart3,
        },
        {
          path: "/org/proposals",
          label: "Mis propuestas",
          icon: FileText,
          badgeKey: "proposals",
        },
      ],
    },
  ],
  PARTNER: [
    {
      section: "Gestión",
      items: [
        {
          path: "/org/activities",
          label: "Mis actividades",
          icon: ClipboardList,
        },
        {
          path: "/org/reports",
          label: "Informes",
          icon: BarChart3,
        },
        {
          path: "/org/proposals",
          label: "Mis propuestas",
          icon: FileText,
          badgeKey: "proposals",
        },
      ],
    },
  ],
};
