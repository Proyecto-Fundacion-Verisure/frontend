import { Link } from 'react-router-dom';
import StatCounter from './StatCounter';

const impactAreas = [
  { title: 'Desoledad', text: 'Acompañamiento emocional y activación comunitaria frente a la soledad no deseada de las personas mayores.', figure: '1.121 mayores · 1.239 h' },
  { title: 'Educar para proteger', text: 'Formación práctica y mentoría para el empleo: Vive, Renace, Reinicia, Despega y MuyTech.', figure: '765 personas · 78 voluntarios' },
  { title: 'Protegidos ante el acoso', text: 'Talleres de prevención del acoso escolar para alumnado, familias y equipos docentes.', figure: '1.843 personas · −56,6% incidencias' },
  { title: 'Voluntariado', text: 'Inclusión comunitaria, apoyo a colectivos vulnerables e iniciativas medioambientales.', figure: '8.505 beneficiarios · 60 actividades' },
];

export default function LandingPage() {
  return (
    <main className="landing">
      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing__container landing-hero__content">
          <h1 id="landing-title">Tu tiempo,<br /><em>multiplicado</em></h1>
          <p className="landing-hero__lead">Una de cada tres personas mayores se siente sola. Únete a la red de voluntariado de la Fundación Verisure y protege lo que más importa: <strong>debemos prevenir más para mitigar menos</strong>.</p>
          <div className="landing-hero__actions">
            <Link className="button button--primary button--large" to="/login">Soy empleado</Link>
            <a className="button button--secondary button--large" href="#colabora">Soy una organización social</a>
          </div>
        </div>
        <div className="landing-hero__art" aria-hidden="true"><span /><i /><b /></div>
      </section>

      <section className="landing-stats" aria-label="Nuestro impacto">
        <div className="landing__container">
          <p className="landing__eyebrow">El año 2025 en cifras</p>
          <div className="landing-stats__grid">
            <StatCounter value="12.234" label="personas beneficiadas de forma directa" />
            <StatCounter value="598" label="personas voluntarias de la plantilla" />
            <StatCounter value="2.655" label="horas de voluntariado dedicadas" />
            <StatCounter value="23" label="entidades sociales aliadas" />
          </div>
        </div>
      </section>

      <section className="landing-impact" id="impacto" aria-labelledby="impact-title">
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Nuestras líneas</p>
            <h2 id="impact-title">Cuatro frentes, una misma red de apoyo.</h2>
            <p>Cada línea agrupa sus programas, sus entidades aliadas y los indicadores de impacto que la plataforma mide de principio a fin.</p>
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

      <section className="landing-cta" id="colabora" aria-labelledby="cta-title">
        <div className="landing__container landing-cta__content">
          <div>
            <p className="landing__eyebrow">Colabora con nosotros</p>
            <h2 id="cta-title">¿Tenéis una necesidad que el voluntariado corporativo pueda cubrir?</h2>
            <p>Contadnos qué necesitáis y el equipo de la Fundación lo revisará. Si encaja con alguna de nuestras cuatro líneas, os llamamos para concretarla.</p>
            <a className="button button--primary button--large" href="#propuesta">Proponer una colaboración</a>
          </div>
          <ol className="landing-cta__steps">
            <li><span>1</span><div><strong>Recibimos tu propuesta</strong><p>Te llega un correo de acuse al instante.</p></div></li>
            <li><span>2</span><div><strong>La revisamos</strong><p>Te llamamos para concretar fechas, plazas y dedicación.</p></div></li>
            <li><span>3</span><div><strong>La publicamos</strong><p>Se convierte en una actividad para la plantilla.</p></div></li>
          </ol>
        </div>
      </section>

      <section className="landing-access" id="propuesta" aria-labelledby="access-title">
        <div className="landing__container">
          <div className="landing-impact__heading">
            <p className="landing__eyebrow">Acceso</p>
            <h2 id="access-title">Dos formas de entrar, según quién seas.</h2>
            <p>Las organizaciones sociales no necesitan cuenta: pueden proponer su colaboración y la Fundación se pondrá en contacto.</p>
          </div>
          <div className="landing-access__grid">
            <Link className="landing-access__card" to="/login"><p className="landing__eyebrow">Empleado de Verisure</p><h3>Explora, participa y mide tu impacto</h3><p>Catálogo de iniciativas abiertas, solicitud en un clic y control de las horas que has donado.</p><span className="button button--primary button--medium">Entrar con mi cuenta</span></Link>
            <a className="landing-access__card" href="#colabora"><p className="landing__eyebrow">Organización social</p><h3>Cuéntanos qué necesitáis</h3><p>Un formulario, sin cuenta ni contraseña. El equipo de la Fundación lo revisa y te contesta por correo.</p><span className="button button--secondary button--medium">Proponer una colaboración</span></a>
          </div>
        </div>
      </section>

    </main>
  );
}
