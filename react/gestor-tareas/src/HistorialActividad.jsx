import { useState, useEffect } from 'react';
import { activityAPI } from './api';

function HistorialActividad({ historial, estudiantes, onClose, boardId }) {
  const [actividadBackend, setActividadBackend] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  // Mapear tipos de actividad del backend a tipos locales
  const mapearTipoActividad = (tipoBackend) => {
    const mapeo = {
      'card_created': 'tarea_creada',
      'card_updated': 'tarea_editada',
      'card_deleted': 'tarea_eliminada',
      'card_moved': 'tarea_movida',
      'card_assigned': 'tarea_asignada',
      'board_created': 'curso_creado',
      'board_updated': 'curso_editado',
      'list_created': 'lista_creada',
      'list_updated': 'lista_editada',
      'comment_added': 'comentario_agregado',
      'checklist_item_added': 'checklist_agregado',
      'checklist_item_completed': 'checklist_completado'
    };
    return mapeo[tipoBackend] || tipoBackend;
  };

  // Cargar actividad del backend cuando cambie el boardId
  useEffect(() => {
    const cargarActividadBackend = async () => {
      if (!boardId) {
        setActividadBackend(null); // null indica que no se intentó cargar
        return;
      }

      setCargando(true);
      setError(null);
      
      try {
        const data = await activityAPI.getByBoard(boardId);
        // El backend puede devolver un array directamente o con paginación
        const actividades = Array.isArray(data) ? data : (data.results || []);
        
        // Mapear actividades del backend al formato esperado
        const actividadesMapeadas = actividades.map(act => ({
          id: act.id,
          tipo: mapearTipoActividad(act.activity_type),
          descripcion: act.description,
          usuario: act.user?.username || act.user?.first_name || 'Usuario',
          fecha: act.created_at
        }));
        
        setActividadBackend(actividadesMapeadas);
      } catch (err) {
        console.error('Error al cargar actividad del backend:', err);
        // Si hay error de red, no mostrar error pero usar historial local
        if (err.isNetworkError || !err.response) {
          setError('No se pudo conectar con el servidor. Mostrando actividad local.');
        } else {
          setError('Error al cargar actividad del servidor.');
        }
        setActividadBackend(null); // null indica fallo, usar historial local
      } finally {
        setCargando(false);
      }
    };

    cargarActividadBackend();
  }, [boardId]);

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerIcono = (tipo) => {
    const iconos = {
      'tarea_creada': '➕',
      'tarea_editada': '✏️',
      'tarea_eliminada': '🗑️',
      'tarea_movida': '↔️',
      'tarea_asignada': '👤',
      'curso_creado': '📚',
      'curso_editado': '📝',
      'estudiante_agregado': '👨‍🎓',
      'lista_creada': '📋',
      'lista_editada': '📝',
      'comentario_agregado': '💬',
      'checklist_agregado': '☑️',
      'checklist_completado': '✅'
    };
    return iconos[tipo] || '📝';
  };

  const obtenerColor = (tipo) => {
    const colores = {
      'tarea_creada': '#4caf50',
      'tarea_editada': '#2196f3',
      'tarea_eliminada': '#f44336',
      'tarea_movida': '#ff9800',
      'tarea_asignada': '#9c27b0',
      'curso_creado': '#00bcd4',
      'curso_editado': '#00bcd4',
      'estudiante_agregado': '#795548',
      'lista_creada': '#607d8b',
      'lista_editada': '#607d8b',
      'comentario_agregado': '#3f51b5',
      'checklist_agregado': '#009688',
      'checklist_completado': '#4caf50'
    };
    return colores[tipo] || '#9e9e9e';
  };

  // Usar actividad del backend si está disponible, sino usar historial local
  // actividadBackend === null significa que hubo un error o no se intentó cargar
  // actividadBackend === [] significa que se cargó pero está vacío
  const actividadMostrar = actividadBackend !== null ? actividadBackend : (historial || []);

  return (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
      maxHeight: '500px',
      overflowY: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, color: '#333', fontSize: '1.5rem' }}>
          📊 Historial de Actividad
        </h2>
        <button
          onClick={onClose}
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
          ✕ Cerrar
        </button>
      </div>

      {cargando && (
        <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
          Cargando actividad...
        </p>
      )}
      
      {error && (
        <p style={{ color: '#f44336', fontSize: '12px', textAlign: 'center', padding: '10px', marginBottom: '10px' }}>
          ⚠️ {error}
        </p>
      )}

      {!cargando && actividadMostrar.length === 0 ? (
        <p style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>
          No hay actividad registrada aún.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {actividadMostrar.map(actividad => (
            <div
              key={actividad.id}
              style={{
                padding: '12px',
                background: '#f5f5f5',
                borderRadius: '8px',
                borderLeft: `4px solid ${obtenerColor(actividad.tipo)}`,
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}
            >
              <span style={{ fontSize: '24px' }}>
                {obtenerIcono(actividad.tipo)}
              </span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, color: '#333', fontSize: '14px', fontWeight: 'bold' }}>
                  {actividad.descripcion}
                </p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '12px' }}>
                  Por: {actividad.usuario} • {formatearFecha(actividad.fecha)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HistorialActividad;

