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
          label: "Nuevo proyecto",
          icon: CirclePlus,
          variant: "cta",
        },
        { path: "/admin/activities", label: "Proyectos", icon: ClipboardList },
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
          path: "/activities/6/registrations",
          label: "Inscripciones",
          icon: UserPlus,
          badgeKey: "inscriptions",
        },
        {
          path: "/admin/activities/pending-closure",
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
        {
          path: "/org/activities/new",
          label: "Nuevo proyecto",
          icon: CirclePlus,
          variant: "cta",
        },
        {
          path: "/org/activities",
          label: "Mis proyectos",
          icon: ClipboardList,
        },
        {
          path: "/org/proposals",
          label: "Mis propuestas",
          icon: FileText,
          badgeKey: "proposals",
        },
        {
          path: "/org/reports",
          label: "Cierres",
          icon: CheckCircle2,
        },
      ],
    },
  ],
};
