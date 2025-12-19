import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Buildings from './components/Buildings';
import Elections from './components/Elections';
import ElectionDetail from './components/ElectionDetail';
import Nominations from './components/Nominations';
import Winners from './components/Winners';
import Residents from './components/Residents';
import Register from './components/Register';
import Login from './components/Login';
import Profile from './components/Profile';
import ApprovalRequests from './components/ApprovalRequests';
import { logout } from './services/api';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return null; // Show nothing when not authenticated
  }
  
  return children;
}

function LogoutButton() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  };

  if (!user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      {user.profilePic && (
        <img 
          src={user.profilePic} 
          alt="Profile" 
          style={{ 
            width: '32px', 
            height: '32px', 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '2px solid #fff'
          }}
        />
      )}
      <span style={{ color: '#fff' }}>{user.fullName || user.phone}</span>
      <button 
        className="btn btn-secondary btn-small"
        onClick={handleLogout}
        style={{ margin: 0 }}
      >
        تسجيل الخروج
      </button>
    </div>
  );
}

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    
    // Get user type from localStorage
    const updateUserType = () => {
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const user = JSON.parse(userData);
          setUserType(user.userType || 'resident');
        } catch (err) {
          console.error('Error parsing user data:', err);
          setUserType('resident');
        }
      } else {
        setUserType('resident');
      }
    };
    
    updateUserType();
    
    // Listen for storage changes (when user logs in from another tab)
    window.addEventListener('storage', updateUserType);
    return () => window.removeEventListener('storage', updateUserType);
  }, []);

  // Show nothing if not authenticated
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }

  // Wait for userType to be loaded
  if (!userType) {
    return <div className="loading">جاري التحميل...</div>;
  }

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="logo">🏢 دار مصر شرق المعهد </h1>
            <button 
              className={`mobile-menu-toggle ${mobileMenuOpen ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {userType === 'manager' ? (
                <>
                  <Link to="/" onClick={() => setMobileMenuOpen(false)}>العمارات</Link>
                  <Link to="/elections" onClick={() => setMobileMenuOpen(false)}>الانتخابات</Link>
                  <Link to="/residents" onClick={() => setMobileMenuOpen(false)}>السكان</Link>
                </>
              ) : (
                <>
                  <Link to="/elections" onClick={() => setMobileMenuOpen(false)}>الانتخابات</Link>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>الملف الشخصي</Link>
                </>
              )}
              <LogoutButton />
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Navigate to={userType === 'manager' ? "/" : "/profile"} replace />} />
            
            {userType === 'manager' ? (
              <>
                <Route path="/" element={
                  <ProtectedRoute>
                    <Buildings />
                  </ProtectedRoute>
                } />
                <Route path="/elections" element={
                  <ProtectedRoute>
                    <Elections />
                  </ProtectedRoute>
                } />
                <Route path="/elections/:id" element={
                  <ProtectedRoute>
                    <ElectionDetail />
                  </ProtectedRoute>
                } />
                <Route path="/approvals" element={
                  <ProtectedRoute>
                    <ApprovalRequests />
                  </ProtectedRoute>
                } />
                <Route path="/residents" element={
                  <ProtectedRoute>
                    <Residents />
                  </ProtectedRoute>
                } />
                <Route path="/register" element={
                  <ProtectedRoute>
                    <Register />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/" replace />} />
              </>
            ) : (
              <>
                <Route path="/elections" element={
                  <ProtectedRoute>
                    <Elections />
                  </ProtectedRoute>
                } />
                <Route path="/elections/:id" element={
                  <ProtectedRoute>
                    <ElectionDetail />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/profile" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
