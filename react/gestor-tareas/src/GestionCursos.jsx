import { useState, useEffect } from 'react';
import { usersAPI } from './api';
import RegistroUsuario from './RegistroUsuario';
import { useTheme } from './ThemeContext.jsx';

function GestionCursos({ 
  cursos, 
  estudiantes = [], 
  cursoActual, 
  onCreateCurso, 
  onAgregarEstudiante, 
  onSelectCurso,
  onEditarCurso,
  onEliminarCurso,
  modoCompacto = false 
}) {
  const [nombreCurso, setNombreCurso] = useState('');
  const [estudianteSeleccionado, setEstudianteSeleccionado] = useState('');
  const [estudiantesBD, setEstudiantesBD] = useState([]);
  const [mostrarFormularioCurso, setMostrarFormularioCurso] = useState(false);
  const [mostrarFormularioEstudiante, setMostrarFormularioEstudiante] = useState(false);
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cursoEditando, setCursoEditando] = useState(null);
  const [nuevoNombreEditado, setNuevoNombreEditado] = useState('');
  const { isDark } = useTheme();

  const estudiantesDelCurso = estudiantes.filter(e => {
    // Comparar cursoId de forma más robusta (manejar string vs número)
    const cursoIdEstudiante = e.cursoId ? String(e.cursoId) : null;
    const cursoIdActual = cursoActual?.id ? String(cursoActual.id) : null;
    return cursoIdEstudiante === cursoIdActual;
  });
  
  console.log('Estudiantes recibidos en GestionCursos:', estudiantes);
  console.log('Curso actual:', cursoActual);
  console.log('Estudiantes del curso filtrados:', estudiantesDelCurso);

  // Cargar estudiantes de la BD
  useEffect(() => {
    const cargarEstudiantes = async () => {
      try {
        setLoading(true);
        const estudiantes = await usersAPI.getStudents();
        if (Array.isArray(estudiantes)) {
          setEstudiantesBD(estudiantes);
        } else {
          setEstudiantesBD([]);
        }
      } catch (error) {
        console.error('Error al cargar estudiantes:', error);
        setEstudiantesBD([]); // Asegurar que siempre sea un array
        // No mostrar error al usuario, solo loguear
      } finally {
        setLoading(false);
      }
    };
    
    // Solo cargar si no estamos mostrando el registro
    if (!mostrarRegistro) {
      cargarEstudiantes();
    }
  }, [mostrarRegistro]); // Recargar cuando se cree un nuevo usuario

  if (modoCompacto) {
    return (
      <div style={{
        background: isDark ? '#2d2d2d' : 'white',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: isDark ? '1px solid #444' : 'none',
        transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
      }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setMostrarFormularioEstudiante(!mostrarFormularioEstudiante)}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ➕ Asignar Estudiante
          </button>
          <button
            onClick={() => setMostrarRegistro(true)}
            style={{
              background: '#2196f3',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            👤 Crear Usuario
          </button>
          <span style={{ color: isDark ? '#aaa' : '#666', fontSize: '14px' }}>
            Estudiantes: {estudiantesDelCurso.length}
          </span>
        </div>

        {mostrarRegistro && (
          <div style={{ marginTop: '15px' }}>
            <RegistroUsuario
              onUsuarioCreado={async () => {
                setMostrarRegistro(false);
                // Recargar estudiantes
                try {
                  const estudiantes = await usersAPI.getStudents();
                  if (Array.isArray(estudiantes)) {
                    setEstudiantesBD(estudiantes);
                  }
                } catch (error) {
                  console.error('Error al recargar estudiantes:', error);
                  // No mostrar error, solo loguear
                }
              }}
              onCancelar={() => setMostrarRegistro(false)}
            />
          </div>
        )}

        {mostrarFormularioEstudiante && !mostrarRegistro && (
          <div style={{ marginTop: '15px', padding: '15px', background: isDark ? '#3d3d3d' : '#f5f5f5', borderRadius: '8px', border: isDark ? '1px solid #555' : 'none' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: isDark ? '#aaa' : '#666', fontSize: '14px', fontWeight: 'bold' }}>
              Seleccionar Estudiante:
            </label>
            {loading ? (
              <p style={{ color: isDark ? '#aaa' : '#666', fontSize: '14px' }}>Cargando estudiantes...</p>
            ) : estudiantesBD.length === 0 ? (
              <p style={{ color: isDark ? '#888' : '#999', fontSize: '14px' }}>No hay estudiantes registrados. Crea uno primero.</p>
            ) : (
              <>
                <select
                  value={estudianteSeleccionado}
                  onChange={(e) => setEstudianteSeleccionado(e.target.value)}
                  style={{
                    padding: '8px',
                    border: `2px solid ${isDark ? '#555' : '#ddd'}`,
                    borderRadius: '5px',
                    fontSize: '14px',
                    width: '100%',
                    maxWidth: '300px',
                    marginBottom: '10px',
                    boxSizing: 'border-box',
                    background: isDark ? '#2d2d2d' : 'white',
                    color: isDark ? '#fff' : '#333'
                  }}
                >
                  <option value="">Selecciona un estudiante</option>
                  {estudiantesBD.map(est => {
                    // El backend devuelve Profile con user anidado
                    const user = est.user || est;
                    const username = user.username || est.username || '';
                    const firstName = user.first_name || est.first_name || '';
                    const lastName = user.last_name || est.last_name || '';
                    const userId = user.id || est.user?.id || est.id;
                    const displayName = firstName && lastName 
                      ? `${username} (${firstName} ${lastName})` 
                      : username || 'Estudiante sin nombre';
                    
                    return (
                      <option key={est.id || userId} value={userId}>
                        {displayName}
                      </option>
                    );
                  })}
                </select>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <button
                    onClick={() => {
                      if (estudianteSeleccionado) {
                        // Buscar por user.id o por profile.id
                        const estudiante = estudiantesBD.find(e => {
                          const userId = e.user?.id || e.id;
                          return userId.toString() === estudianteSeleccionado.toString();
                        });
                        
                        if (estudiante) {
                          const user = estudiante.user || estudiante;
                          onAgregarEstudiante({
                            id: estudiante.id,
                            nombre: user.username || estudiante.username || 'Estudiante',
                            userId: user.id || estudiante.id
                          });
                          setEstudianteSeleccionado('');
                          setMostrarFormularioEstudiante(false);
                        }
                      }
                    }}
                    style={{
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginRight: '5px'
                    }}
                  >
                    Asignar
                  </button>
                  <button
                    onClick={() => {
                      setMostrarFormularioEstudiante(false);
                      setEstudianteSeleccionado('');
                    }}
                    style={{
                      background: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {estudiantesDelCurso.length > 0 && (
          <div style={{ marginTop: '15px' }}>
            <p style={{ margin: '0 0 10px 0', color: isDark ? '#aaa' : '#666', fontSize: '14px', fontWeight: 'bold' }}>
              Estudiantes del curso:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {estudiantesDelCurso.map(est => {
                // Asegurar que siempre se renderice un string, no un objeto
                const nombreEstudiante = typeof est === 'object' && est !== null
                  ? (est.nombre || est.username || 'Estudiante')
                  : String(est || 'Estudiante');
                
                return (
                  <span
                    key={est.id || est.userId || Date.now()}
                    style={{
                      background: isDark ? '#1e3a5f' : '#e3f2fd',
                      padding: '5px 12px',
                      borderRadius: '15px',
                      fontSize: '13px',
                      color: '#1976d2',
                      border: isDark ? '1px solid #555' : 'none'
                    }}
                  >
                    👨‍🎓 {nombreEstudiante}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h2 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '1.8rem' }}>
        Gestión de Cursos
      </h2>

      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={() => setMostrarFormularioCurso(!mostrarFormularioCurso)}
          style={{
            background: '#2196f3',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          ➕ Crear Nuevo Curso
        </button>

        {mostrarFormularioCurso && (
          <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '10px' }}>
            <input
              type="text"
              placeholder="Nombre del curso"
              value={nombreCurso}
              onChange={(e) => setNombreCurso(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && nombreCurso.trim()) {
                  onCreateCurso(nombreCurso.trim());
                  setNombreCurso('');
                  setMostrarFormularioCurso(false);
                }
              }}
              style={{
                padding: '12px',
                border: '2px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                width: '100%',
                maxWidth: '400px',
                marginBottom: '15px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  if (nombreCurso.trim()) {
                    onCreateCurso(nombreCurso.trim());
                    setNombreCurso('');
                    setMostrarFormularioCurso(false);
                  }
                }}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Crear Curso
              </button>
              <button
                onClick={() => {
                  setMostrarFormularioCurso(false);
                  setNombreCurso('');
                }}
                style={{
                  background: '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 style={{ margin: '0 0 15px 0', color: '#555', fontSize: '1.3rem' }}>
          Mis Cursos
        </h3>
        {cursos.length === 0 ? (
          <p style={{ color: '#999', fontStyle: 'italic' }}>
            No tienes cursos creados. Crea uno para comenzar.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cursos.map(curso => (
              <div
                key={curso.id}
                style={{
                  padding: '15px',
                  background: cursoActual?.id === curso.id ? '#e3f2fd' : '#f5f5f5',
                  borderRadius: '8px',
                  border: cursoActual?.id === curso.id ? '2px solid #2196f3' : '2px solid transparent',
                  transition: 'all 0.2s',
                  marginBottom: '10px'
                }}
              >
                {cursoEditando?.id === curso.id ? (
                  // Modo edición
                  <div>
                    <input
                      type="text"
                      value={nuevoNombreEditado}
                      onChange={(e) => setNuevoNombreEditado(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && nuevoNombreEditado.trim()) {
                          if (onEditarCurso) {
                            onEditarCurso(curso.id, nuevoNombreEditado.trim());
                            setCursoEditando(null);
                            setNuevoNombreEditado('');
                          }
                        }
                      }}
                      style={{
                        padding: '8px',
                        border: '2px solid #2196f3',
                        borderRadius: '5px',
                        fontSize: '14px',
                        width: '100%',
                        marginBottom: '10px',
                        boxSizing: 'border-box'
                      }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button
                        onClick={() => {
                          if (onEditarCurso && nuevoNombreEditado.trim()) {
                            onEditarCurso(curso.id, nuevoNombreEditado.trim());
                            setCursoEditando(null);
                            setNuevoNombreEditado('');
                          }
                        }}
                        style={{
                          background: '#4caf50',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => {
                          setCursoEditando(null);
                          setNuevoNombreEditado('');
                        }}
                        style={{
                          background: '#9e9e9e',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  // Modo visualización
                  <div>
                    <div 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        cursor: 'pointer'
                      }}
                      onClick={() => onSelectCurso(curso)}
                    >
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: '#333', fontSize: '1.1rem' }}>
                          📚 {curso.nombre}
                        </h4>
                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>
                          Docente: {curso.docente}
                        </p>
                      </div>
                      {cursoActual?.id === curso.id && (
                        <span style={{
                          background: '#4caf50',
                          color: 'white',
                          padding: '5px 12px',
                          borderRadius: '15px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          marginRight: '10px'
                        }}>
                          Activo
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      display: 'flex', 
                      gap: '8px', 
                      marginTop: '10px',
                      justifyContent: 'flex-end'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursoEditando(curso);
                          setNuevoNombreEditado(curso.nombre);
                        }}
                        style={{
                          background: '#2196f3',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`¿Estás seguro de que quieres eliminar el curso "${curso.nombre}"? Esta acción no se puede deshacer.`)) {
                            if (onEliminarCurso) {
                              onEliminarCurso(curso.id);
                            }
                          }
                        }}
                        style={{
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default GestionCursos;




