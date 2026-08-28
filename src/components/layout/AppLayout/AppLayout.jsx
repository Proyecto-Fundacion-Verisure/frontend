import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';

export default function AdminLayout({ children }) {
  return <div className="admin-layout"><Topbar /><Sidebar /><main>{children}</main></div>;
}
