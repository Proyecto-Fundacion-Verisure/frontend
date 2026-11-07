import { getOrgActivities } from '../../orgs';
import { ApiError } from '../../../shared/api/apiError';

const PAGE_SIZE = 50;
const MAX_PAGES = 50;

function isSameActivity(item, activityId) {
  return String(item.id) === String(activityId);
}

// No hay `GET /api/org/activities/{id}`: la fila viene del listado por el
// `state` del enlace «Editar» y, si se entra por URL, se busca en las páginas
// del listado hasta dar con ella. Lo que no esté ahí es 404, y una de otra
// entidad nunca aparece: el backend filtra por el `partnerId` del token.
export default async function findOrgActivity(activityId, routeActivity) {
  if (routeActivity && isSameActivity(routeActivity, activityId)) return routeActivity;

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const { data } = await getOrgActivities({ page, size: PAGE_SIZE });
    const found = (data?.content ?? []).find((item) => isSameActivity(item, activityId));

    if (found) return found;
    if (page + 1 >= (data?.totalPages ?? 0)) break;
  }

  throw new ApiError({
    message: 'No se ha encontrado el recurso solicitado.',
    status: 404,
  });
}
