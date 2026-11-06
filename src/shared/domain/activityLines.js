export const ACTIVITY_LINES = [
  {
    value: "desoledad",
    label: "Desoledad",
    image: "/images/lines/desoledad.svg",
    description: "Portada en tonos cálidos con el icono de un corazón y un apretón de manos.",
  },
  {
    value: "educar",
    label: "Educar para proteger",
    image: "/images/lines/educar.svg",
    description: "Portada en tonos azules con el icono de un libro abierto.",
  },
  {
    value: "acoso",
    label: "Protegidos ante el acoso",
    image: "/images/lines/acoso.svg",
    description: "Portada en tonos violetas con el icono de un escudo.",
  },
  {
    value: "medioambiente",
    label: "Medio ambiente",
    image: "/images/lines/medioambiente.svg",
    description: "Portada en tonos verdes con el icono de un brote.",
  },
];

export function getLineByValue(value) {
  return ACTIVITY_LINES.find((line) => line.value === value) ?? null;
}