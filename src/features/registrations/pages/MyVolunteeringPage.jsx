import MyVolunteeringBlocks from '../components/MyVolunteeringBlocks';
import MyVolunteeringEmpty from '../components/MyVolunteeringEmpty';
import MyVolunteeringError from '../components/MyVolunteeringError';
import MyVolunteeringLoading from '../components/MyVolunteeringLoading';
import useMyVolunteering from '../hooks/useMyVolunteering';

export default function MyVolunteeringPage() {
  const volunteering = useMyVolunteering();

  const isEmpty =
    !volunteering.hasError &&
    volunteering.activeList.length === 0 &&
    volunteering.historyList.length === 0;
  const hasContent = !volunteering.hasError && !isEmpty;

  return (
    <>
      {volunteering.isLoading && <MyVolunteeringLoading />}

      {volunteering.hasError && (
        <MyVolunteeringError error={volunteering.error} onRetry={volunteering.retry} />
      )}

      {!volunteering.isLoading && !volunteering.hasError && isEmpty && <MyVolunteeringEmpty />}

      {!volunteering.isLoading && hasContent && (
        <MyVolunteeringBlocks
          activeList={volunteering.activeList}
          historyList={volunteering.historyList}
          cancelError={volunteering.cancelError}
          cancellingId={volunteering.cancellingId}
          onCancel={volunteering.cancel}
        />
      )}
    </>
  );
}
