import { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext.jsx';
import { cardsAPI } from './api';

function Calificaciones({ usuario, cursoActual }) {
  const { isDark } = useTheme();
  const [calificaciones, setCalificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Mapeo de calificaciones a colores y emojis
  const calificacionesMap = {
    'bueno': { color: '#4caf50', emoji: '✅', texto: 'Bueno' },
    'malo': { color: '#f44336', emoji: '❌', texto: 'Malo' },
    'pesimo': { color: '#d32f2f', emoji: '⚠️', texto: 'Pésimo' },
    'necesita_mejorar': { color: '#ff9800', emoji: '⚠️', texto: 'Necesita Mejorar' }
  };

  useEffect(() => {
    if (cursoActual) {
      cargarCalificaciones();
    }
  }, [cursoActual?.id, usuario]);

  const cargarCalificaciones = async () => {
    try {
      setCargando(true);
      // Obtener todas las cards del curso
      const cards = await cardsAPI.getAll({ board: cursoActual.id });
      
      // Filtrar solo las que tienen calificación
      const cardsCalificadas = cards.filter(card => card.grade);
      
      // Si es estudiante, filtrar solo sus tareas
      let cardsFiltradas = cardsCalificadas;
      if (usuario.rol === 'estudiante') {
        cardsFiltradas = cardsCalificadas.filter(card => 
          card.assigned_to && card.assigned_to.id === usuario.id
        );
      }

      // Mapear a formato de calificaciones
      const calificacionesMapeadas = cardsFiltradas.map(card => ({
        id: card.id,
        titulo: card.title,
        descripcion: card.description || '',
        calificacion: card.grade,
        estudiante: card.assigned_to 
          ? (card.assigned_to.first_name && card.assigned_to.last_name
              ? `${card.assigned_to.first_name} ${card.assigned_to.last_name}`
              : card.assigned_to.username)
          : 'Sin asignar',
        estudianteId: card.assigned_to ? card.assigned_to.id : null,
        fechaVencimiento: card.due_date,
        fechaCompletada: card.completed_at || null
      }));

      // Ordenar por fecha de vencimiento (más recientes primero)
      calificacionesMapeadas.sort((a, b) => {
        if (!a.fechaVencimiento && !b.fechaVencimiento) return 0;
        if (!a.fechaVencimiento) return 1;
        if (!b.fechaVencimiento) return -1;
        return new Date(b.fechaVencimiento) - new Date(a.fechaVencimiento);
      });

      setCalificaciones(calificacionesMapeadas);
    } catch (error) {
      console.error('Error al cargar calificaciones:', error);
      setCalificaciones([]);
    } finally {
      setCargando(false);
    }
  };

  // Agrupar calificaciones por estudiante (solo para docentes)
  const calificacionesPorEstudiante = () => {
    if (usuario.rol !== 'docente') return null;
    
    const agrupadas = {};
    calificaciones.forEach(cal => {
      const key = cal.estudianteId || 'sin_asignar';
      if (!agrupadas[key]) {
        agrupadas[key] = {
          estudiante: cal.estudiante,
          calificaciones: []
        };
      }
      agrupadas[key].calificaciones.push(cal);
    });
    
    return agrupadas;
  };

  if (cargando) {
    return (
      <div style={{
        background: isDark ? '#2d2d2d' : 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center',
        color: isDark ? '#aaa' : '#666'
      }}>
        Cargando calificaciones...
      </div>
    );
  }

  if (calificaciones.length === 0) {
    return (
      <div style={{
        background: isDark ? '#2d2d2d' : 'white',
        padding: '30px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center',
        boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: isDark ? '1px solid #444' : 'none'
      }}>
        <h3 style={{ 
          margin: '0 0 10px 0', 
          color: isDark ? '#fff' : '#333',
          fontSize: '1.2rem'
        }}>
          📊 Calificaciones
        </h3>
        <p style={{ 
          color: isDark ? '#aaa' : '#666',
          fontSize: '14px',
          margin: 0
        }}>
          {usuario.rol === 'docente' 
            ? 'No hay tareas calificadas aún. Las tareas completadas aparecerán aquí cuando las califiques.'
            : 'No tienes calificaciones aún. Las tareas completadas y calificadas aparecerán aquí.'}
        </p>
      </div>
    );
  }

  // Vista para docente: agrupada por estudiante
  if (usuario.rol === 'docente') {
    const agrupadas = calificacionesPorEstudiante();
    
    return (
      <div style={{
        background: isDark ? '#2d2d2d' : 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: isDark ? '1px solid #444' : 'none'
      }}>
        <h3 style={{ 
          margin: '0 0 20px 0', 
          color: isDark ? '#fff' : '#333',
          fontSize: '1.3rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          📊 Calificaciones ({calificaciones.length} tarea{calificaciones.length !== 1 ? 's' : ''})
        </h3>

        {Object.keys(agrupadas).map(estudianteId => {
          const grupo = agrupadas[estudianteId];
          return (
            <div 
              key={estudianteId}
              style={{
                marginBottom: '25px',
                padding: '15px',
                background: isDark ? '#3d3d3d' : '#f5f5f5',
                borderRadius: '8px',
                border: isDark ? '1px solid #555' : '1px solid #e0e0e0'
              }}
            >
              <h4 style={{
                margin: '0 0 15px 0',
                color: isDark ? '#fff' : '#333',
                fontSize: '1.1rem',
                borderBottom: `2px solid ${isDark ? '#555' : '#ddd'}`,
                paddingBottom: '8px'
              }}>
                👨‍🎓 {grupo.estudiante} ({grupo.calificaciones.length} tarea{grupo.calificaciones.length !== 1 ? 's' : ''})
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {grupo.calificaciones.map(cal => {
                  const calInfo = calificacionesMap[cal.calificacion] || calificacionesMap['bueno'];
                  return (
                    <div
                      key={cal.id}
                      style={{
                        padding: '12px',
                        background: isDark ? '#2d2d2d' : 'white',
                        borderRadius: '6px',
                        border: `2px solid ${calInfo.color}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '10px'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: '200px' }}>
                        <h5 style={{
                          margin: '0 0 5px 0',
                          color: isDark ? '#fff' : '#333',
                          fontSize: '14px',
                          fontWeight: 'bold'
                        }}>
                          {cal.titulo}
                        </h5>
                        {cal.descripcion && (
                          <p style={{
                            margin: '0 0 5px 0',
                            fontSize: '12px',
                            color: isDark ? '#aaa' : '#666',
                            fontStyle: 'italic'
                          }}>
                            {cal.descripcion}
                          </p>
                        )}
                        {cal.fechaVencimiento && (
                          <p style={{
                            margin: 0,
                            fontSize: '11px',
                            color: isDark ? '#777' : '#999'
                          }}>
                            Vencimiento: {new Date(cal.fechaVencimiento).toLocaleDateString('es-ES')}
                          </p>
                        )}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 12px',
                        background: `${calInfo.color}20`,
                        borderRadius: '8px',
                        border: `2px solid ${calInfo.color}`
                      }}>
                        <span style={{ fontSize: '18px' }}>{calInfo.emoji}</span>
                        <span style={{
                          color: calInfo.color,
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {calInfo.texto}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Vista para estudiante: lista simple
  return (
    <div style={{
      background: isDark ? '#2d2d2d' : 'white',
      padding: '20px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: isDark ? '1px solid #444' : 'none'
    }}>
      <h3 style={{ 
        margin: '0 0 20px 0', 
        color: isDark ? '#fff' : '#333',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        📊 Mis Calificaciones ({calificaciones.length} tarea{calificaciones.length !== 1 ? 's' : ''})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {calificaciones.map(cal => {
          const calInfo = calificacionesMap[cal.calificacion] || calificacionesMap['bueno'];
          return (
            <div
              key={cal.id}
              style={{
                padding: '15px',
                background: isDark ? '#3d3d3d' : '#f5f5f5',
                borderRadius: '8px',
                border: `2px solid ${calInfo.color}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = isDark 
                  ? `0 4px 8px rgba(0, 0, 0, 0.4)` 
                  : `0 4px 8px rgba(0, 0, 0, 0.15)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ flex: 1, minWidth: '250px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  color: isDark ? '#fff' : '#333',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {cal.titulo}
                </h4>
                {cal.descripcion && (
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '13px',
                    color: isDark ? '#aaa' : '#666',
                    fontStyle: 'italic'
                  }}>
                    {cal.descripcion}
                  </p>
                )}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                  {cal.fechaVencimiento && (
                    <span style={{
                      fontSize: '12px',
                      color: isDark ? '#777' : '#999'
                    }}>
                      📅 {new Date(cal.fechaVencimiento).toLocaleDateString('es-ES')}
                    </span>
                  )}
                  {cal.fechaCompletada && (
                    <span style={{
                      fontSize: '12px',
                      color: isDark ? '#777' : '#999'
                    }}>
                      ✅ Completada: {new Date(cal.fechaCompletada).toLocaleDateString('es-ES')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                background: `${calInfo.color}20`,
                borderRadius: '10px',
                border: `2px solid ${calInfo.color}`,
                minWidth: '150px',
                justifyContent: 'center'
              }}>
                <span style={{ fontSize: '24px' }}>{calInfo.emoji}</span>
                <span style={{
                  color: calInfo.color,
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}>
                  {calInfo.texto}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calificaciones;

