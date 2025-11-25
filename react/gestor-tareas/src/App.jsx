import { useState, useEffect } from 'react';
import Tablero from './Tablero.jsx';
import Login from './Login.jsx';
import ErrorBoundary from './ErrorBoundary.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import SwaggerUI from './SwaggerUI.jsx';
import Notificaciones from './Notificaciones.jsx';
import { ThemeProvider, useTheme } from './ThemeContext.jsx';
import './App.css'; // Asegúrate de tener esto para aplicar los estilos

function AppContent() {
  const { isDark } = useTheme();
  const [usuario, setUsuario] = useState(null);
  const [vistaActual, setVistaActual] = useState('tablero'); // 'tablero' o 'swagger'

  // Verificar si hay un usuario guardado al cargar la app
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const accessToken = localStorage.getItem('access_token');
    
    if (savedUser && accessToken) {
      try {
        const userData = JSON.parse(savedUser);
        setUsuario(userData);
      } catch (error) {
        console.error('Error al cargar usuario:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
    }
  }, []);

  const handleLogin = (datosUsuario) => {
    setUsuario(datosUsuario);
  };

  const handleLogout = () => {
    // Limpiar tokens y datos del usuario
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUsuario(null);
  };

  if (!usuario) {
    return (
      <ErrorBoundary>
        <div className="login-page"> {/*  agregado para centrar */}
          <Login onLogin={handleLogin} />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          minHeight: '100vh',
          background: isDark ? '#1a1a1a' : '#f0f2f5',
          fontFamily: 'Arial, sans-serif',
          color: isDark ? '#fff' : '#333',
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }}
      >
        <div
          style={{
            background: isDark ? '#2d2d2d' : 'white',
            padding: '20px',
            boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            borderBottom: isDark ? '1px solid #444' : 'none',
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
          }}
        >
          <div>
            <h1 style={{ margin: 0, color: isDark ? '#fff' : '#333', fontSize: '1.5rem' }}>
              Bienvenido, {usuario.nombre}!
            </h1>
            <p style={{ margin: '5px 0 0 0', color: isDark ? '#aaa' : '#666', fontSize: '0.9rem' }}>
              {usuario.rol === 'docente' ? '👨‍🏫 Docente' : '👨‍🎓 Estudiante'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Notificaciones usuario={usuario} />
            <button
              onClick={() => setVistaActual(vistaActual === 'tablero' ? 'swagger' : 'tablero')}
              style={{
                background: vistaActual === 'swagger' ? '#2196F3' : (isDark ? '#444' : '#e0e0e0'),
                color: vistaActual === 'swagger' ? 'white' : (isDark ? '#fff' : '#333'),
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontSize: '0.9rem',
                fontWeight: vistaActual === 'swagger' ? 'bold' : 'normal'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              {vistaActual === 'tablero' ? '📚 Ver API Docs' : '📋 Ver Tablero'}
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'opacity 0.3s ease'
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.9'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
        {vistaActual === 'tablero' ? (
          <Tablero usuario={usuario} />
        ) : (
          <SwaggerUI />
        )}
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
