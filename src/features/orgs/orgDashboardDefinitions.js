import { CalendarCheck2, Clock3, HeartHandshake, Users } from 'lucide-react';

export const ORG_KPI_DEFINITIONS = [
  { key: 'receivedHours', label: 'Horas recibidas', Icon: Clock3, suffix: ' h' },
  { key: 'activities', label: 'Actividades', Icon: CalendarCheck2 },
  { key: 'distinctVolunteers', label: 'Voluntarios distintos', Icon: Users },
  { key: 'benefitedPeople', label: 'Personas beneficiadas', Icon: HeartHandshake },
];

export const ORG_KPI_KEYS = ORG_KPI_DEFINITIONS.map(({ key }) => key);