export const ACTIVITY_LINES = [
  {
    value: "desoledad",
    label: "Desoledad",
    image: "/images/01-desoledad-linea-de-accion.png",
    description: "Dos personas mayores sentadas frente a frente, acompañándose y conversando, con un corazón sobre ellas.",
  },
  {
    value: "educar",
    label: "Educar para proteger",
    image: "/images/02-educar-linea-de-accion.png",
    description: "Persona aprendiendo y alcanzando una estrella sobre un libro abierto.",
  },
  {
    value: "acoso",
    label: "Protegidos ante el acoso",
    image: "/images/03-acoso-linea-de-accion.png",
    description: "Tres personas protegidas por un escudo y sostenidas por dos manos.",
  },
  {
    value: "medioambiente",
    label: "Medio ambiente",
    image: "/images/04-medioambiente-linea-de-accion.png",
    description: "Tres personas rodeadas y sostenidas por manos, con una planta creciendo sobre ellas.",
  },
];

export function getLineByValue(value) {
  return ACTIVITY_LINES.find((line) => line.value === value) ?? null;
}