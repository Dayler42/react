import { useState, useEffect } from 'react';
import { commentsAPI } from './api';
import { useTheme } from './ThemeContext.jsx';

function Comentarios({ cardId, usuario }) {
  const { isDark } = useTheme();
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarComentarios, setMostrarComentarios] = useState(false);
  const [enviando, setEnviando] = useState(false);

  // Cargar comentarios al montar el componente para obtener el conteo
  useEffect(() => {
    if (cardId) {
      cargarComentarios();
    }
  }, [cardId]);

  // Recargar comentarios cuando se abre el panel para asegurar datos actualizados
  useEffect(() => {
    if (mostrarComentarios && cardId) {
      cargarComentarios();
    }
  }, [mostrarComentarios, cardId]);

  const cargarComentarios = async () => {
    try {
      setCargando(true);
      const data = await commentsAPI.getAll(cardId);
      // Si es un array, usarlo directamente; si tiene results, usar results
      const comentariosList = Array.isArray(data) ? data : (data.results || []);
      setComentarios(comentariosList);
    } catch (error) {
      console.error('Error al cargar comentarios:', error);
      setComentarios([]);
    } finally {
      setCargando(false);
    }
  };

  const agregarComentario = async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!nuevoComentario.trim()) {
      return;
    }

    try {
      setEnviando(true);
      const comentarioCreado = await commentsAPI.create({
        card: cardId,
        content: nuevoComentario.trim()
      });
      
      // Agregar el nuevo comentario a la lista
      setComentarios(prev => [comentarioCreado, ...prev]);
      setNuevoComentario('');
    } catch (error) {
      console.error('Error al crear comentario:', error);
      alert('Error al agregar el comentario. Por favor, intenta nuevamente.');
    } finally {
      setEnviando(false);
    }
  };

  const eliminarComentario = async (comentarioId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
      return;
    }

    try {
      await commentsAPI.delete(comentarioId);
      setComentarios(prev => prev.filter(c => c.id !== comentarioId));
    } catch (error) {
      console.error('Error al eliminar comentario:', error);
      alert('Error al eliminar el comentario. Por favor, intenta nuevamente.');
    }
  };

  const formatearFecha = (fechaISO) => {
    const fecha = new Date(fechaISO);
    const ahora = new Date();
    const diffMs = ahora - fecha;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerNombreAutor = (author) => {
    if (!author) return 'Usuario';
    return author.username || author.first_name || author.nombre || 'Usuario';
  };

  return (
    <div 
      style={{ 
        marginTop: '10px',
        borderTop: `1px solid ${isDark ? '#555' : '#e0e0e0'}`,
        paddingTop: '10px'
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setMostrarComentarios(!mostrarComentarios);
        }}
        style={{
          background: 'transparent',
          border: 'none',
          color: isDark ? '#aaa' : '#666',
          fontSize: '11px',
          cursor: 'pointer',
          padding: '4px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          fontWeight: 'bold'
        }}
      >
        💬 Comentarios ({comentarios.length})
        <span style={{ fontSize: '10px' }}>
          {mostrarComentarios ? '▼' : '▶'}
        </span>
      </button>

      {mostrarComentarios && (
        <div style={{ marginTop: '8px' }}>
          {/* Formulario para agregar comentario */}
          <div style={{ marginBottom: '10px' }}>
            <textarea
              value={nuevoComentario}
              onChange={(e) => {
                e.stopPropagation();
                setNuevoComentario(e.target.value);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter' && e.ctrlKey) {
                  agregarComentario(e);
                }
              }}
              placeholder="Escribe un comentario... (Ctrl+Enter para enviar)"
              style={{
                width: '100%',
                padding: '6px',
                border: `1px solid ${isDark ? '#555' : '#ddd'}`,
                borderRadius: '4px',
                fontSize: '11px',
                minHeight: '50px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'Arial, sans-serif',
                background: isDark ? '#2d2d2d' : 'white',
                color: isDark ? '#fff' : '#333',
                marginBottom: '5px'
              }}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            />
            <button
              type="button"
              onClick={agregarComentario}
              disabled={enviando || !nuevoComentario.trim()}
              style={{
                background: enviando || !nuevoComentario.trim() ? '#ccc' : '#2196f3',
                color: 'white',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                cursor: enviando || !nuevoComentario.trim() ? 'not-allowed' : 'pointer',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {enviando ? 'Enviando...' : 'Enviar'}
            </button>
          </div>

          {/* Lista de comentarios */}
          {cargando ? (
            <p style={{ 
              fontSize: '11px', 
              color: isDark ? '#aaa' : '#666',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '10px'
            }}>
              Cargando comentarios...
            </p>
          ) : comentarios.length === 0 ? (
            <p style={{ 
              fontSize: '11px', 
              color: isDark ? '#777' : '#999',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '10px'
            }}>
              No hay comentarios aún. ¡Sé el primero en comentar!
            </p>
          ) : (
            <div style={{ 
              maxHeight: '200px', 
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {comentarios.map(comentario => (
                <div
                  key={comentario.id}
                  style={{
                    background: isDark ? '#2d2d2d' : '#f5f5f5',
                    padding: '8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    border: `1px solid ${isDark ? '#444' : '#e0e0e0'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '4px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <strong style={{ 
                        color: isDark ? '#fff' : '#333',
                        fontSize: '11px'
                      }}>
                        {obtenerNombreAutor(comentario.author)}
                      </strong>
                      <span style={{ 
                        color: isDark ? '#888' : '#999',
                        fontSize: '10px',
                        marginLeft: '6px'
                      }}>
                        {formatearFecha(comentario.created_at)}
                      </span>
                    </div>
                    {(usuario.rol === 'docente' || 
                      (comentario.author && comentario.author.id === usuario.id)) && (
                      <button
                        type="button"
                        onClick={(e) => eliminarComentario(comentario.id, e)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#f44336',
                          cursor: 'pointer',
                          fontSize: '10px',
                          padding: '2px 4px',
                          pointerEvents: 'auto',
                          zIndex: 10
                        }}
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        title="Eliminar comentario"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <p style={{ 
                    margin: 0,
                    color: isDark ? '#ddd' : '#555',
                    fontSize: '11px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {comentario.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Comentarios;



