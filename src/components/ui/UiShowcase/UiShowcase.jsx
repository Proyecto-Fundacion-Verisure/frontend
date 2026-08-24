import { useState } from 'react';
import Badge from '../Badge/Badge';
import Button from '../Button/Button';
import Card from '../Card/Card';
import EmptyState from '../EmptyState/EmptyState';
import Input from '../Input/Input';
import Modal from '../Modal/Modal';
import ProgressBar from '../ProgressBar/ProgressBar';
import Select from '../Select/Select';
import Spinner from '../Spinner/Spinner';
import Table from '../Table/Table';
import Textarea from '../Textarea/Textarea';

const columns = [
  { key: 'name', label: 'Actividad' },
  { key: 'places', label: 'Plazas' },
  { key: 'status', label: 'Estado', render: (row) => <Badge variant="success">{row.status}</Badge> },
];

const data = [{ id: 1, name: 'Acompañamiento educativo', places: '8 de 12', status: 'Abierta' }];

export default function UiShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <main className="ui-showcase">
      <header>
        <p className="ui-showcase__eyebrow">Fundación Verisure</p>
        <h1>Sistema de componentes UI</h1>
        <p>Referencia visual de variantes y estados reutilizables.</p>
      </header>

      <section className="ui-showcase__section">
        <h2>Acciones y estados</h2>
        <div className="ui-showcase__row">
          <Button>Acción principal</Button>
          <Button variant="secondary">Secundaria</Button>
          <Button variant="outline">Alternativa</Button>
          <Button variant="danger">Eliminar</Button>
          <Button disabled>Deshabilitada</Button>
          <Button isLoading>Guardando</Button>
          <Spinner />
        </div>
        <div className="ui-showcase__row">
          <Badge>Neutral</Badge>
          <Badge variant="primary">Destacada</Badge>
          <Badge variant="success">Confirmada</Badge>
          <Badge variant="warning">Pendiente</Badge>
          <Badge variant="danger">Rechazada</Badge>
          <Badge variant="info">Información</Badge>
        </div>
      </section>

      <section className="ui-showcase__section">
        <h2>Formulario</h2>
        <div className="ui-showcase__form">
          <Input label="Nombre de la actividad" placeholder="Ej. Taller educativo" required />
          <Select label="Modalidad" defaultValue="" required>
            <option value="" disabled>Selecciona una opción</option>
            <option>Presencial</option>
            <option>Online</option>
          </Select>
          <Textarea label="Descripción" hint="Resume el objetivo de la actividad." />
          <Input label="Correo" defaultValue="correo incorrecto" error="Introduce un correo válido." />
          <Input label="Campo deshabilitado" value="No editable" disabled readOnly />
        </div>
      </section>

      <section className="ui-showcase__section">
        <h2>Contenido</h2>
        <div className="ui-showcase__grid">
          <Card>
            <h3>Progreso del aforo</h3>
            <ProgressBar label="Plazas ocupadas" value={8} max={12} showValue />
          </Card>
          <Card>
            <EmptyState
              title="Todavía no hay actividades"
              description="Las nuevas actividades aparecerán aquí."
              action={<Button variant="outline">Volver al catálogo</Button>}
            />
          </Card>
        </div>
        <Table caption="Actividades recientes" columns={columns} data={data} />
      </section>

      <section className="ui-showcase__section">
        <h2>Diálogo</h2>
        <Button onClick={() => setIsModalOpen(true)}>Abrir modal</Button>
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Confirmar acción"
          description="Comprueba los datos antes de continuar."
          footer={(
            <>
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button onClick={() => setIsModalOpen(false)}>Confirmar</Button>
            </>
          )}
        >
          Esta acción se aplicará inmediatamente.
        </Modal>
      </section>
    </main>
  );
}
