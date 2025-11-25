import { useState } from 'react';
import { authAPI } from './api';

function RegistroUsuario({ onUsuarioCreado, onCancelar }) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'student' // 'student' o 'teacher'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    // Validaciones
    if (!formData.username.trim()) {
      setError('El nombre de usuario es requerido');
      setLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError('El email es requerido');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    try {
      await authAPI.register(formData);
      setSuccess(true);
      
      // Limpiar formulario
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'student'
      });

      // Notificar al componente padre
      if (onUsuarioCreado) {
        setTimeout(() => {
          onUsuarioCreado();
          setSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error('Error al registrar usuario:', err);
      setLoading(false);
      
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          // Manejar diferentes formatos de error
          const errorMessages = [];
          Object.keys(errors).forEach(key => {
            if (Array.isArray(errors[key])) {
              errorMessages.push(...errors[key]);
            } else if (typeof errors[key] === 'string') {
              errorMessages.push(errors[key]);
            } else {
              errorMessages.push(`${key}: ${JSON.stringify(errors[key])}`);
            }
          });
          setError(errorMessages.length > 0 ? errorMessages.join(', ') : 'Error al crear el usuario');
        } else if (typeof errors === 'string') {
          setError(errors);
        } else {
          setError(errors.detail || 'Error al crear el usuario');
        }
      } else if (err.message) {
        if (err.message.includes('Network Error') || err.code === 'ERR_NETWORK') {
          setError('Error de conexión. Verifica que el backend esté corriendo en http://localhost:8001');
        } else {
          setError(`Error: ${err.message}`);
        }
      } else {
        setError('Error al conectar con el servidor. Verifica que el backend esté corriendo.');
      }
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '500px',
      margin: '0 auto'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.8rem' }}>
        ➕ Crear Nuevo Usuario
      </h2>

      {success && (
        <div style={{
          marginBottom: '18px',
          padding: '12px',
          background: '#e8f5e9',
          border: '1px solid #4caf50',
          borderRadius: '8px',
          color: '#2e7d32',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          ✅ Usuario creado exitosamente!
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: '18px',
          padding: '12px',
          background: '#fee',
          border: '1px solid #fcc',
          borderRadius: '8px',
          color: '#c33',
          fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
            Tipo de Usuario:
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'student' }))}
              style={{
                flex: 1,
                padding: '10px',
                border: formData.role === 'student' ? '3px solid #4caf50' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: formData.role === 'student' ? '#e8f5e9' : 'white',
                color: formData.role === 'student' ? '#4caf50' : '#666',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              👨‍🎓 Estudiante
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, role: 'teacher' }))}
              style={{
                flex: 1,
                padding: '10px',
                border: formData.role === 'teacher' ? '3px solid #2196f3' : '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                background: formData.role === 'teacher' ? '#e3f2fd' : 'white',
                color: formData.role === 'teacher' ? '#2196f3' : '#666',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              👨‍🏫 Docente
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
            Nombre de Usuario: *
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
            Email: *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
              Nombre:
            </label>
            <input
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
              Apellido:
            </label>
            <input
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
            Contraseña: *
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '14px' }}>
            Confirmar Contraseña: *
          </label>
          <input
            type="password"
            name="password_confirm"
            value={formData.password_confirm}
            onChange={handleChange}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '12px',
              background: loading ? '#ccc' : '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.3s ease',
            }}
          >
            {loading ? 'Creando...' : 'Crear Usuario'}
          </button>
          {onCancelar && (
            <button
              type="button"
              onClick={onCancelar}
              style={{
                padding: '12px 24px',
                background: '#9e9e9e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default RegistroUsuario;

