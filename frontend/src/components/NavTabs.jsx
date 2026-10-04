import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function NavTabs() {
  const linkClass = ({ isActive }) => `navlink${isActive ? ' active' : ''}`;
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navtabs" style={{ flexWrap: 'wrap' }}>
      <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
      <NavLink to="/analysis" className={linkClass}>Analysis</NavLink>
      <NavLink to="/chatbot" className={linkClass}>Assistant</NavLink>
      <NavLink to="/reduce-pollution" className={linkClass}>Reduce Pollution</NavLink>
      <NavLink to="/authorities" className={linkClass}>Authorities</NavLink>
      {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {isAuthenticated ? (
          <>
            <span className="sub" style={{ fontSize: 12 }}>
              {user?.name} {isAdmin && <span style={{ color: 'var(--amber)' }}>(Admin)</span>}
            </span>
            <button className="navlink" style={{ cursor: 'pointer' }} onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <NavLink to="/login" className={linkClass}>Login</NavLink>
        )}
      </div>
    </nav>
  );
}
