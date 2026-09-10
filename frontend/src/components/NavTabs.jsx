import { NavLink } from 'react-router-dom';

export default function NavTabs() {
  const linkClass = ({ isActive }) => `navlink${isActive ? ' active' : ''}`;

  return (
    <nav className="navtabs">
      <NavLink to="/" end className={linkClass}>
        Dashboard
      </NavLink>
      <NavLink to="/analysis" className={linkClass}>
        Analysis
      </NavLink>
    </nav>
  );
}
