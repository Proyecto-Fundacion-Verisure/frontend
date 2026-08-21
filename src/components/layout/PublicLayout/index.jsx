import Topbar from '../Topbar';

export default function PublicLayout({ children }) {
  return <div className="public-layout"><Topbar /><main>{children}</main></div>;
}
