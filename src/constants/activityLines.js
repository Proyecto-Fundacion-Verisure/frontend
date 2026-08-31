export const ACTIVITY_LINES = [
  {
    value: "desoledad",
    label: "Desoledad",
    image: "/images/01-desoledad-linea-de-accion.png",
  },
  {
    value: "educar",
    label: "Educar para proteger",
    image: "/images/02-educar-linea-de-accion.png",
  },
  {
    value: "acoso",
    label: "Protegidos ante el acoso",
    image: "/images/03-acoso-linea-de-accion.png",
  },
  {
    value: "voluntariado",
    label: "Voluntariado",
    image: "/images/04-voluntariado-linea-de-accion.png",
  },
];

export function getLineByValue(value) {
  return ACTIVITY_LINES.find((line) => line.value === value) ?? null;
}