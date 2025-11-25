import { useState, useEffect, useRef } from 'react';
import { activityAPI } from './api';
import { useTheme } from './ThemeContext.jsx';

function Notificaciones({ usuario }) {
  const { isDark } = useTheme();
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(new Set());
  const [mostrarDropdown, setMostrarDropdown] = useState(false);
  const [cargando, setCargando] = useState(false);
  const dropdownRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar notificaciones
  const cargarNotificaciones = async () => {
    try {
      setCargando(true);
      const actividades = await activityAPI.getAll();
      
      // Convertir actividades a notificaciones
      const notificacionesData = (Array.isArray(actividades) ? actividades : []).map(actividad => ({
        id: actividad.id,
        tipo: actividad.activity_type,
        descripcion: actividad.description,
        usuario: actividad.user?.username || 'Usuario',
        tablero: actividad.board_name || `Tablero #${actividad.board}`,
        fecha: actividad.created_at,
        metadata: actividad.metadata || {},
        board: actividad.board
      }));

      // Ordenar por fecha más reciente primero
      notificacionesData.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

      // Detectar notificaciones nuevas comparando con el estado actual
      setNotificaciones(prevNotificaciones => {
        if (prevNotificaciones.length === 0) {
          // Primera carga: marcar todas como no leídas
          setNotificacionesNoLeidas(new Set(notificacionesData.map(n => n.id)));
        } else {
          // Detectar nuevas notificaciones
          const nuevasNotificaciones = notificacionesData.filter(
            n => !prevNotificaciones.find(old => old.id === n.id)
          );
          nuevasNotificaciones.forEach(n => {
            setNotificacionesNoLeidas(prev => new Set([...prev, n.id]));
          });
        }
        return notificacionesData;
      });
    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
    } finally {
      setCargando(false);
    }
  };

  // Cargar notificaciones al montar y cuando cambia el usuario
  useEffect(() => {
    if (usuario) {
      cargarNotificaciones();

      // Configurar polling cada 30 segundos
      pollingIntervalRef.current = setInterval(() => {
        cargarNotificaciones();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [usuario]);

  // Marcar todas como leídas
  const marcarTodasComoLeidas = () => {
    setNotificacionesNoLeidas(new Set());
  };

  // Marcar una notificación como leída
  const marcarComoLeida = (id) => {
    setNotificacionesNoLeidas(prev => {
      const nuevo = new Set(prev);
      nuevo.delete(id);
      return nuevo;
    });
  };

  // Obtener ícono según el tipo de actividad
  const obtenerIcono = (tipo) => {
    const iconos = {
      'card_created': '📝',
      'card_updated': '✏️',
      'card_deleted': '🗑️',
      'card_moved': '↔️',
      'card_assigned': '👤',
      'comment_added': '💬',
      'checklist_item_added': '✅',
      'checklist_item_completed': '✔️',
      'board_created': '📋',
      'board_updated': '📝',
      'list_created': '📄',
      'list_updated': '✏️',
    };
    return iconos[tipo] || '🔔';
  };

  // Formatear fecha relativa
  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} h`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filtrar notificaciones relevantes según el rol
  const notificacionesRelevantes = notificaciones.filter(notif => {
    // Para estudiantes, mostrar solo actividades relacionadas con sus tareas
    if (usuario.rol === 'estudiante') {
      return ['card_created', 'card_updated', 'card_assigned', 'comment_added'].includes(notif.tipo);
    }
    // Para docentes, mostrar todas
    return true;
  }).slice(0, 10); // Mostrar solo las 10 más recientes

  const cantidadNoLeidas = Array.from(notificacionesNoLeidas).filter(id =>
    notificacionesRelevantes.find(n => n.id === id)
  ).length;

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setMostrarDropdown(!mostrarDropdown);
          if (!mostrarDropdown) {
            marcarTodasComoLeidas();
          }
        }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '8px 12px',
          borderRadius: '8px',
          position: 'relative',
          fontSize: '20px',
          color: isDark ? '#fff' : '#333',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = isDark ? '#444' : '#f0f0f0'}
        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        🔔
        {cantidadNoLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '4px',
              right: '8px',
              background: '#f44336',
              color: 'white',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              border: `2px solid ${isDark ? '#2d2d2d' : 'white'}`
            }}
          >
            {cantidadNoLeidas > 9 ? '9+' : cantidadNoLeidas}
          </span>
        )}
        {cargando && (
          <span style={{ fontSize: '12px', color: isDark ? '#aaa' : '#666' }}>
            ...
          </span>
        )}
      </button>

      {mostrarDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: isDark ? '#2d2d2d' : 'white',
            border: `1px solid ${isDark ? '#555' : '#ddd'}`,
            borderRadius: '8px',
            boxShadow: isDark 
              ? '0 4px 12px rgba(0, 0, 0, 0.5)' 
              : '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '350px',
            maxWidth: '450px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: isDark ? '#3d3d3d' : '#f5f5f5',
              borderRadius: '8px 8px 0 0',
              position: 'sticky',
              top: 0,
              zIndex: 10
            }}
          >
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: isDark ? '#fff' : '#333' }}>
              🔔 Notificaciones
            </h3>
            {cantidadNoLeidas > 0 && (
              <button
                type="button"
                onClick={marcarTodasComoLeidas}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2196f3',
                  cursor: 'pointer',
                  fontSize: '12px',
                  padding: '4px 8px',
                  borderRadius: '4px'
                }}
                onMouseOver={(e) => e.target.style.background = isDark ? '#444' : '#e0e0e0'}
                onMouseOut={(e) => e.target.style.background = 'transparent'}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          {/* Lista de notificaciones */}
          <div>
            {notificacionesRelevantes.length === 0 ? (
              <div
                style={{
                  padding: '40px 20px',
                  textAlign: 'center',
                  color: isDark ? '#aaa' : '#666',
                  fontSize: '13px'
                }}
              >
                No hay notificaciones
              </div>
            ) : (
              notificacionesRelevantes.map(notif => {
                const esNoLeida = notificacionesNoLeidas.has(notif.id);
                return (
                  <div
                    key={notif.id}
                    onClick={() => marcarComoLeida(notif.id)}
                    style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                      cursor: 'pointer',
                      background: esNoLeida ? (isDark ? '#3d3d3d' : '#f0f7ff') : 'transparent',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseOver={(e) => {
                      if (!esNoLeida) {
                        e.currentTarget.style.background = isDark ? '#3d3d3d' : '#f5f5f5';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!esNoLeida) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: '20px', flexShrink: 0 }}>
                        {obtenerIcono(notif.tipo)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '13px',
                            fontWeight: esNoLeida ? 'bold' : 'normal',
                            color: isDark ? '#fff' : '#333',
                            marginBottom: '4px',
                            lineHeight: '1.4'
                          }}
                        >
                          {notif.descripcion}
                        </div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: isDark ? '#888' : '#999',
                            marginTop: '4px',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                          }}
                        >
                          <span>{notif.tablero}</span>
                          <span>•</span>
                          <span>{formatearFecha(notif.fecha)}</span>
                          {esNoLeida && (
                            <>
                              <span>•</span>
                              <span
                                style={{
                                  background: '#2196f3',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '10px',
                                  fontSize: '10px'
                                }}
                              >
                                Nuevo
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notificacionesRelevantes.length > 0 && (
            <div
              style={{
                padding: '8px 16px',
                borderTop: `1px solid ${isDark ? '#444' : '#e0e0e0'}`,
                textAlign: 'center',
                background: isDark ? '#3d3d3d' : '#f5f5f5',
                borderRadius: '0 0 8px 8px'
              }}
            >
              <span style={{ fontSize: '11px', color: isDark ? '#aaa' : '#666' }}>
                Mostrando {notificacionesRelevantes.length} de {notificaciones.length} notificaciones
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Notificaciones;

