import Topbar from '../Topbar';
import Sidebar from '../Sidebar';

export default function EmployeeLayout({ children }) {
  return <div className="employee-layout"><Topbar /><Sidebar /><main>{children}</main></div>;
}
