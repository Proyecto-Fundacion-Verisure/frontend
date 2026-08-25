import Sidebar from '../Sidebar/Sidebar';
import Topbar from '../Topbar/Topbar';

export default function EmployeeLayout({ children }) {
  return <div className="employee-layout"><Topbar /><Sidebar /><main>{children}</main></div>;
}
