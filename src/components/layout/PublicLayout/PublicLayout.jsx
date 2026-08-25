import PublicHeader from '../PublicHeader/PublicHeader';
import PublicFooter from '../PublicFooter/PublicFooter';

export default function PublicLayout({ children }) {
  return (
    <div className="public-layout">
      <PublicHeader />
      <main>{children}</main>
      <PublicFooter />
    </div>
  );
}
