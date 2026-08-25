import { Link } from "react-router-dom";
import handHeartIcon from '../../assets/icons/hand-heart.svg';
import clockIcon from '../../assets/icons/clock.svg';
import usersIcon from '../../assets/icons/users.svg';
import buildingIcon from '../../assets/icons/building.svg';
import colabImage from '../../assets/images/landing-colaboration.png'
import StatCounter from "./StatCounter";

const impactAreas = [
  {
    title: "Desoledad",
    text: "Acompañamiento emocional y activación comunitaria frente a la soledad no deseada de las personas mayores.",
    figure: "1.121 mayores · 1.239 h",
  },
  {
    title: "Educar para proteger",
    text: "Formación práctica y mentoría para el empleo: Vive, Renace, Reinicia, Despega y MuyTech.",
    figure: "765 personas · 78 voluntarios",
  },
  {
    title: "Protegidos ante el acoso",
    text: "Talleres de prevención del acoso escolar para alumnado, familias y equipos docentes.",
    figure: "1.843 personas · −56,6% incidencias",
  },
  {
    title: "Voluntariado",
    text: "Inclusión comunitaria, apoyo a colectivos vulnerables e iniciativas medioambientales.",
    figure: "8.505 beneficiarios · 60 actividades",
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing__container landing-hero__content">
          <h1 id="landing-title">
            El cambio empieza
            <br />
            <em>contigo</em>
          </h1>
          <p className="landing-hero__lead">
            Una de cada tres personas mayores se siente sola. Únete a la red de
            voluntariado de la Fundación Verisure y protege lo que más importa:{" "}
            <strong>debemos prevenir más para mitigar menos</strong>.
          </p>
          <div className="landing-hero__actions">
            <Link className="button button--primary button--large" to="/login">
              Soy empleado
            </Link>
            <a
              className="button button--secondary button--large"
              href="#colabora"
            >
              Soy una organización social
            </a>
          </div>
        </div>
        <div className="landing-hero__art" aria-hidden="true">
          <span />
          <i />
          <b />
        </div>
      </section>

      <section className="landing-stats" aria-label="Nuestro impacto">
        <div className="landing__container">
          <p className="landing__eyebrow">El año 2025 en cifras</p>
          <div className="landing-stats__grid">
            <StatCounter
              value="12.234"
              label="personas beneficiadas de forma directa"
              icon={handHeartIcon}
            />
            <StatCounter
              value="598"
              label="personas voluntarias de la plantilla"
              icon={usersIcon}
            />
            <StatCounter
              value="2.655"
              label="horas de voluntariado dedicadas"
              icon={clockIcon}
            />
            <StatCounter 
              value="23" 
              label="organizaciones sociales aliadas"
              icon={buildingIcon}  
            />
          </div>
        </div>
      </section>

      <section
        className="landing-impact"
        id="impacto"
        aria-labelledby="impact-title"
      >
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Nuestras líneas</p>
            <h2 id="impact-title">Cuatro frentes, una misma red de apoyo.</h2>
            <p>
              Cada línea agrupa sus programas, sus entidades aliadas y los
              indicadores de impacto que la plataforma mide de principio a fin.
            </p>
          </div>
          <div className="landing-impact__grid">
            {impactAreas.map((area) => (
              <article className="landing-impact__card" key={area.title}>
                <h3>{area.title}</h3>
                <p>{area.text}</p>
                <p className="landing-impact__figure">{area.figure}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="landing-access"
        id="propuesta"
        aria-labelledby="access-title"
      >
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Unamos fuerzas</p>
            <h2 id="access-title">Construyamos impacto juntos</h2>
            <p>
              Creemos que las mejores iniciativas nacen cuando organizaciones y
              empresas unen sus capacidades para generar un{" "}
              <strong>impacto real.</strong>
              <br />
              Por eso, queremos colaborar con entidades sociales que compartan
              nuestro compromiso con las personas, la comunidad y la
              construcción de una sociedad más solidaria.
            </p>
          </div>
          <div className="landing-access__grid">
            <div className="landing-access__card">
              <p className="landing__eyebrow">Organización social</p>
              <h3>Explora, participa y mide tu impacto</h3>
              <p>
                Queremos que las entidades sociales tengan un papel protagonista. Cuéntanos qué necesidades detectáis y qué iniciativas de voluntariado podrían marcar la diferencia, y trabajaremos juntos para convertir esas ideas en proyectos reales.
              </p>
              <img src={colabImage} alt="imagen de personas haciendo un voluntariado" />
            </div>
            <a className="landing-access__card" href="#colabora">
              <p className="landing__eyebrow">Iniciativas</p>
              <h3>¿Qué podemos hacer juntos?</h3>
              <p>
                <ul>
                  <li>Actividades de voluntariado con nuestros equipos.</li>
                  <li>Campañas solidarias y de sensibilización.</li> 
                  <li>Recogidas de alimentos, material u otros recursos.</li>
                  <li>Recogidas de alimentos, material u otros recursos.</li>
                  <li>Acompañamiento y apoyo a colectivos en situación de vulnerabilidad.</li>
                  <li>Actividades educativas, ambientales, culturales o comunitarias.</li>
                  <li>Proyectos de voluntariado adaptados a las necesidades específicas de vuestra entidad.</li><br />
                  <p>... y mucho más.</p>
                </ul>
              </p>
              <a className="button button--primary button--medium" href="#colabora">
                Quiero contactar
              </a>
            </a>
          </div>
        </div>
      </section>

      <section
        className="landing-cta"
        id="colabora"
        aria-labelledby="cta-title"
      >
        <div className="landing__container landing-cta__content">
          <div>
            <p className="landing__eyebrow">Colabora con nosotros</p>
            <h2 id="cta-title">
              Tú conoces las necesidades. Nosotros queremos ayudarte a hacerlas
              realidad.
            </h2>
            <p>
              Si tenéis una iniciativa en mente, una necesidad concreta o
              simplemente una idea que os gustaría explorar, queremos conocerla.
              Proponnos una iniciativa de voluntariado y descubramos juntos cómo
              podemos hacerla realidad.
            </p>
            <Link to="/new-proposal"
              className="button button--primary button--large"
              href="#propuesta"
            >
              Proponer una colaboración
            </Link>
          </div>
          <ol className="landing-cta__steps">
            <li>
              <span>1</span>
              <div>
                <strong>Recibimos tu propuesta</strong>
                <p>Te llega un correo de acuse al instante</p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>La revisamos</strong>
                <p>Te llamamos para concretar fechas, plazas y dedicación.</p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>La publicamos</strong>
                <p>Se convierte en una actividad para la plantilla.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
