import { LayoutDashboard, ClipboardList, Users, FileText, Compass, FileBarChart, UserPlus, CheckCircle2, CirclePlus } from 'lucide-react';

export const NAV_ITEMS_BY_ROLE = {
  ADMIN: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/informs', label: 'Informes', icon: FileBarChart },
    { path: '/activities', label: 'Actividades', icon: ClipboardList },
    { path: '/proposals', label: 'Propuestas', icon: FileText },
    { path: '/inscriptions', label: 'Inscripciones', icon: UserPlus },
    { path: '/closures', label: 'Cierres', icon: CheckCircle2 },
    { path: '/users', label: 'Usuarios y roles', icon: Users },
    { path: '/create-activity', label: 'Crear actividad', icon: CirclePlus },
  ],
  EMPLOYEE: [
    { path: '/explore', label: 'Explorar', icon: Compass },
    { path: '/my-activities', label: 'Mis voluntariados', icon: ClipboardList },
  ],
  ORGANIZATION: [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/my-activities', label: 'Mis actividades', icon: ClipboardList },
    { path: '/proposals', label: 'Propuestas', icon: FileText },
  ],
};