import { Link } from 'react-router-dom';
import { Building, Clock, HandHeart, Users } from 'lucide-react';
import colabImage from '../assets/landing-collaboration.webp';
import footerPortrait from '../../../shared/assets/images/footer-portrait.jpg';
import StatCounter from '../components/StatCounter';

const impactAreas = [
  {
    title: 'Desoledad',
    text: 'Acompañamiento emocional y activación comunitaria frente a la soledad no deseada de las personas mayores.',
    figure: '1.121 mayores · 1.239 h',
  },
  {
    title: 'Educar para proteger',
    text: 'Formación práctica y mentoría para el empleo: Vive, Renace, Reinicia, Despega y MuyTech.',
    figure: '765 personas · 78 voluntarios',
  },
  {
    title: 'Protegidos ante el acoso',
    text: 'Talleres de prevención del acoso escolar para alumnado, familias y equipos docentes.',
    figure: '1.843 personas · −56,6% incidencias',
  },
  {
    title: 'Voluntariado',
    text: 'Inclusión comunitaria, apoyo a colectivos vulnerables e iniciativas medioambientales.',
    figure: '8.505 beneficiarios · 60 actividades',
  },
];

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing__container landing-hero__content">
          <h1 id="landing-title">
            El cambio empieza<em> contigo</em>
          </h1>
          <p className="landing-hero__lead">
            Una de cada tres personas mayores se siente sola. Únete a la red de voluntariado de la
            Fundación Verisure y protege lo que más importa:{' '}
            <strong>debemos prevenir más para mitigar menos</strong>.
          </p>
          <div className="landing-hero__actions">
            <Link className="button button--primary button--medium" to="/login">
              Soy empleado
            </Link>
            <Link className="button button--secondary button--medium" to="/register-organization">
              Registra tu organización
            </Link>
          </div>
        </div>
        <div className="landing-hero__art" aria-hidden="true">
          <img src={footerPortrait} alt="" className="landing-hero__art-image" />
        </div>
      </section>

      <section className="landing-stats" aria-label="Nuestro impacto">
        <div className="landing__container">
          <p className="landing__eyebrow">El año 2025 en cifras</p>
          <div className="landing-stats__grid">
            <StatCounter
              value="12.234"
              label="personas beneficiadas de forma directa"
              icon={HandHeart}
            />
            <StatCounter value="598" label="personas voluntarias de la plantilla" icon={Users} />
            <StatCounter value="2.655" label="horas de voluntariado dedicadas" icon={Clock} />
            <StatCounter value="23" label="organizaciones sociales aliadas" icon={Building} />
          </div>
        </div>
      </section>

      <section className="landing-impact" id="impacto" aria-labelledby="impact-title">
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Nuestras líneas</p>
            <h2 id="impact-title">Cuatro frentes, una misma red de apoyo.</h2>
            <p>
              Cada línea agrupa sus programas, sus organizaciones aliadas y los indicadores de
              impacto que la plataforma mide de principio a fin.
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

      <section className="landing-access" id="propuesta" aria-labelledby="access-title">
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Unamos fuerzas</p>
            <h2 id="access-title">Construyamos impacto juntos</h2>
            <p>
              Creemos que las mejores iniciativas nacen cuando organizaciones y empresas unen sus
              capacidades para generar un <strong>impacto real.</strong>
              Por eso, queremos colaborar con organizaciones sociales que compartan nuestro
              compromiso con las personas, la comunidad y la construcción de una sociedad más
              solidaria.
            </p>
          </div>
          <div className="landing-access__grid">
            <div className="landing-access__card">
              <p className="landing__eyebrow">Organización social</p>
              <h3>Explora, participa y mide tu impacto</h3>
              <p>
                Queremos que las organizaciones sociales tengan un papel protagonista. Cuéntanos qué
                necesidades detectáis y qué iniciativas de voluntariado podrían marcar la
                diferencia, y trabajaremos juntos para convertir esas ideas en actividades reales.
              </p>
              <img
                src={colabImage}
                alt="Personas voluntarias colaborando en una actividad comunitaria"
              />
              <div className="landing-access__actions">
                <Link className="button button--primary button--medium" to="/register-organization">
                  Registra tu organización
                </Link>
              </div>
            </div>
            <div className="landing-access__card">
              <p className="landing__eyebrow">Iniciativas</p>
              <h3>¿Qué podemos hacer juntos?</h3>
              <ul className="landing-access__list">
                <li>
                  Actividades de voluntariado adaptadas a las necesidades específicas de vuestra
                  organización.
                </li>
                <li>Campañas solidarias y de sensibilización.</li>
                <li>Recogidas de alimentos, material u otros recursos.</li>
                <li>Acompañamiento y apoyo a colectivos en situación de vulnerabilidad.</li>
                <li>Actividades educativas, ambientales, culturales o comunitarias.</li>
              </ul>
              <p>
                <strong>¿Cómo funciona?</strong>
              </p>
              <ol className="landing-access__steps">
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
              <div className="landing-access__actions">
                <Link className="button button--primary button--medium" to="/new-proposal">
                  ¿Quieres proponer un voluntariado?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
