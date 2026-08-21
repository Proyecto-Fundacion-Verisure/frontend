import Topbar from '../Topbar';
import Sidebar from '../Sidebar';

export default function AdminLayout({ children }) {
  return <div className="admin-layout"><Topbar /><Sidebar /><main>{children}</main></div>;
}
