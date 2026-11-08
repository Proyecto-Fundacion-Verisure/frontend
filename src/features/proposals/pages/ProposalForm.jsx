import ProposalFormAside from '../components/ProposalFormAside';
import ProposalFormFields from '../components/ProposalFormFields';
import ProposalFormIntro from '../components/ProposalFormIntro';
import ProposalSuccess from '../components/ProposalSuccess';
import useProposalForm from '../hooks/useProposalForm';

export default function ProposalForm() {
  const form = useProposalForm();

  return (
    <>
      {form.isSuccess && <ProposalSuccess onReset={form.handleResetSuccess} />}
      {!form.isSuccess && (
        <section className="proposal-page" aria-labelledby="proposal-title">
          <ProposalFormIntro />
          <div className="proposal-page__layout">
            <ProposalFormFields form={form} />
            <ProposalFormAside />
          </div>
        </section>
      )}
    </>
  );
}
