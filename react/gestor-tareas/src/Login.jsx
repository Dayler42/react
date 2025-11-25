import { useState } from 'react';
import { authAPI, profileAPI } from './api';
import RegistroUsuario from './RegistroUsuario';
import { useTheme } from './ThemeContext.jsx';

function Login({ onLogin }) {
  const { isDark } = useTheme();
  const [rolSeleccionado, setRolSeleccionado] = useState(''); // 'teacher' o 'student'
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!rolSeleccionado) {
      setError('Por favor, selecciona un rol (Docente o Estudiante)');
      setLoading(false);
      return;
    }

    if (usuario.trim() === '' || password.trim() === '') {
      setError('Por favor, completa todos los campos');
      setLoading(false);
      return;
    }

    try {
      // Autenticar con el backend
      const tokenData = await authAPI.login(usuario, password);
      
      // Guardar tokens en localStorage
      localStorage.setItem('access_token', tokenData.access);
      localStorage.setItem('refresh_token', tokenData.refresh);

      // Obtener información del perfil
      const profile = await profileAPI.getMe();
      
      // Validar que el rol del usuario coincida con el seleccionado
      if (profile.role !== rolSeleccionado) {
        const rolEsperado = rolSeleccionado === 'teacher' ? 'Docente' : 'Estudiante';
        const rolActual = profile.role === 'teacher' ? 'Docente' : 'Estudiante';
        setError(`Este usuario es ${rolActual}, pero intentaste ingresar como ${rolEsperado}. Por favor, selecciona el rol correcto.`);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setLoading(false);
        return;
      }
      
      // Guardar información del usuario
      const userData = {
        id: profile.user.id,
        nombre: profile.user.username,
        email: profile.user.email,
        rol: profile.role === 'teacher' ? 'docente' : 'estudiante',
        profile: profile,
      };
      localStorage.setItem('user', JSON.stringify(userData));

      // Llamar a onLogin con los datos del usuario
      onLogin(userData);
    } catch (err) {
      console.error('Error de autenticación:', err);
      
      // Manejar errores de red/conexión
      if (err.isNetworkError || !err.response) {
        setError('No se puede conectar con el servidor. Verifica que el backend Django esté corriendo en http://localhost:8001');
      } else if (err.response?.status === 401) {
        setError('Usuario o contraseña incorrectos');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error al conectar con el servidor. Verifica que el backend esté corriendo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif',
        animation: 'fadeIn 0.8s ease-in-out',
      }}
    >
      <style>
        {`
          /* Animación de entrada */
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* Efecto al enfocar un input */
          input:focus {
            border-color: #764ba2 !important;
            box-shadow: 0 0 8px rgba(118, 75, 162, 0.3);
          }

          /* Adaptación a pantallas pequeñas */
          @media (max-width: 480px) {
            .login-container {
              padding: 24px !important;
            }
            .login-container h2 {
              font-size: 22px !important;
            }
          }
        `}
      </style>

      {mostrarRegistro ? (
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <RegistroUsuario
            onUsuarioCreado={() => {
              setMostrarRegistro(false);
            }}
            onCancelar={() => setMostrarRegistro(false)}
          />
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button
              type="button"
              onClick={() => setMostrarRegistro(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                textDecoration: 'underline',
              }}
            >
              ← Volver al inicio de sesión
            </button>
          </div>
        </div>
      ) : (
        <div
          className="login-container"
          style={{
            width: '100%',
            maxWidth: '420px',
            background: isDark ? '#2d2d2d' : 'white',
            padding: '36px',
            borderRadius: '14px',
            boxShadow: isDark ? '0 8px 28px rgba(0, 0, 0, 0.5)' : '0 8px 28px rgba(0, 0, 0, 0.2)',
            transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease',
            border: isDark ? '1px solid #444' : 'none',
          }}
        >
          <h2
            style={{
              textAlign: 'center',
              margin: 0,
              marginBottom: '24px',
              color: isDark ? '#fff' : '#333',
              fontSize: '26px',
              letterSpacing: '0.5px',
            }}
          >
            Iniciar Sesión
          </h2>

          <form onSubmit={handleSubmit}>
          {error && (
            <div
              style={{
                marginBottom: '18px',
                padding: '12px',
                background: isDark ? '#4a1a1a' : '#fee',
                border: isDark ? '1px solid #6a2a2a' : '1px solid #fcc',
                borderRadius: '8px',
                color: isDark ? '#ff6b6b' : '#c33',
                fontSize: '14px',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#aaa' : '#555',
                fontWeight: 'bold',
              }}
            >
              Ingresar como:
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setRolSeleccionado('teacher')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: rolSeleccionado === 'teacher' ? '3px solid #2196f3' : `2px solid ${isDark ? '#555' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: rolSeleccionado === 'teacher' ? (isDark ? '#1e3a5f' : '#e3f2fd') : (isDark ? '#3d3d3d' : 'white'),
                  color: rolSeleccionado === 'teacher' ? '#2196f3' : (isDark ? '#ccc' : '#666'),
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                👨‍🏫 Docente
              </button>
              <button
                type="button"
                onClick={() => setRolSeleccionado('student')}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: rolSeleccionado === 'student' ? '3px solid #4caf50' : `2px solid ${isDark ? '#555' : '#ddd'}`,
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  background: rolSeleccionado === 'student' ? (isDark ? '#1e4a2e' : '#e8f5e9') : (isDark ? '#3d3d3d' : 'white'),
                  color: rolSeleccionado === 'student' ? '#4caf50' : (isDark ? '#ccc' : '#666'),
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                👨‍🎓 Estudiante
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#aaa' : '#555',
                fontWeight: 'bold',
              }}
            >
              Usuario:
            </label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingresa tu usuario"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isDark ? '#555' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                background: isDark ? '#3d3d3d' : 'white',
                color: isDark ? '#fff' : '#333',
              }}
            />
          </div>

          <div style={{ marginBottom: '26px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                color: isDark ? '#aaa' : '#555',
                fontWeight: 'bold',
              }}
            >
              Contraseña:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña"
              style={{
                width: '100%',
                padding: '12px',
                border: `2px solid ${isDark ? '#555' : '#ddd'}`,
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box',
                outline: 'none',
                transition: 'all 0.2s ease-in-out',
                background: isDark ? '#3d3d3d' : 'white',
                color: isDark ? '#fff' : '#333',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading
                ? '#ccc'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s ease',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background =
                  'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background =
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
              }
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center', paddingTop: '20px', borderTop: `1px solid ${isDark ? '#444' : '#eee'}` }}>
          <p style={{ margin: '0 0 10px 0', color: isDark ? '#aaa' : '#666', fontSize: '14px' }}>
            ¿No tienes una cuenta?
          </p>
          <button
            type="button"
            onClick={() => setMostrarRegistro(true)}
            style={{
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background 0.3s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
            }}
          >
            👤 Crear Nueva Cuenta
          </button>
        </div>
      </div>
      )}
    </div>
  );
}

export default Login;

