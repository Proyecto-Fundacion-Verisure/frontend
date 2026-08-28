import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  Compass,
  UserPlus,
  CheckCircle2,
  CirclePlus,
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
          path: "/create-activity",
          label: "Crear actividad",
          icon: CirclePlus,
          variant: "cta",
        },
        { path: "/activities", label: "Actividades", icon: ClipboardList },
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
          path: "/inscriptions",
          label: "Inscripciones",
          icon: UserPlus,
          badgeKey: "inscriptions",
        },
        {
          path: "/closes",
          label: "Cierres",
          icon: CheckCircle2,
          badgeKey: "closes",
        },
      ],
    },
  ],
  EMPLOYEE: [
    {
      section: "Voluntariado",
      items: [
        { path: "/explore", label: "Explorar", icon: Compass },
        {
          path: "/my-activities",
          label: "Mis voluntariados",
          icon: ClipboardList,
        },
      ],
    },
  ],
  ORGANIZATION: [
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
          path: "/create-activity",
          label: "Crear actividad",
          icon: CirclePlus,
          variant: "cta",
        },
        {
          path: "/my-activities",
          label: "Mis actividades",
          icon: ClipboardList,
        },
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
          path: "/closes",
          label: "Cierres",
          icon: CheckCircle2,
          badgeKey: "closes",
        },
      ],
    },
  ],
};
