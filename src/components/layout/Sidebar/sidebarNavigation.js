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
import { DEMO_REGISTRATIONS_PATH } from "../../../constants/demoActivity";

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
        { path: "/proposals", label: "Propuestas", icon: FileText },
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
          // Apunta a la ruta final y no a `/inscriptions`: el menú usa NavLink y
          // con la redirección de por medio el resaltado de activo se perdería.
          path: DEMO_REGISTRATIONS_PATH,
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
        // La entidad no publica actividades: propone. Lo que rellena en
        // `/org/activities` es una propuesta de actividad que la Fundación
        // aprueba o devuelve, y solo al aprobarla pasa al catálogo.
        {
          path: "/org/activities/new",
          label: "Nueva propuesta",
          icon: CirclePlus,
          variant: "cta",
        },
        {
          path: "/org/activities",
          label: "Mis propuestas",
          icon: ClipboardList,
        },
      ],
    },
  ],
};
