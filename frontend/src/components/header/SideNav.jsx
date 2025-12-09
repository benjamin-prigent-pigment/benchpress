import { Link, useLocation } from 'react-router-dom';
import './SideNav.css';

function SideNav() {
  const location = useLocation();

  return (
    <nav className="side-nav">
      <h2 className="side-nav-title">🏋️ Benchpress</h2>
      <div className="side-nav-links">
        <Link 
          to="/templates" 
          className={location.pathname.startsWith('/templates') ? 'active' : ''}
        >
          Templates
        </Link>
        <Link 
          to="/components" 
          className={location.pathname.startsWith('/components') ? 'active' : ''}
        >
          Components
        </Link>
        <Link 
          to="/results" 
          className={location.pathname.startsWith('/results') ? 'active' : ''}
        >
          Results
        </Link>
      </div>
    </nav>
  );
}

export default SideNav;

