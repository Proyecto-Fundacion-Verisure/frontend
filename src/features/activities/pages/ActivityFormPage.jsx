import ActivityForm from '../components/ActivityForm';
import ActivityFormLoadError from '../components/ActivityFormLoadError';
import ActivityFormLoading from '../components/ActivityFormLoading';
import ActivityFormResult from '../components/ActivityFormResult';
import PublishConfirmation from '../components/PublishConfirmation';
import useActivityForm from '../hooks/useActivityForm';

const VIEW_COMPONENTS = {
  loading: ActivityFormLoading,
  error: ActivityFormLoadError,
  result: ActivityFormResult,
  form: ActivityForm,
};

export default function ActivityFormPage({ backPath = '/dashboard' }) {
  const form = useActivityForm({ backPath });
  const View = VIEW_COMPONENTS[form.view];

  return (
    <>
      <View
        form={form}
        backPath={backPath}
        errorCopy={form.errorCopy}
        errorMessage={form.errorMessage}
        onRetry={form.handleRetryLoad}
        resultCopy={form.resultCopy}
        isEditMode={form.isEditMode}
        onPublish={form.handlePublishRequest}
        onContinueEditing={form.handleContinueEditing}
        onReset={form.handleReset}
      />
      <PublishConfirmation
        isOpen={form.isPublishConfirmOpen}
        isPublishing={form.isPublishing}
        onClose={form.handleClosePublish}
        onConfirm={form.handlePublish}
        isPartner={form.isPartner}
      />
    </>
  );
}
