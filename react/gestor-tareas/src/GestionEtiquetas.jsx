import { useState, useEffect } from 'react';
import { labelsAPI } from './api';
import { useTheme } from './ThemeContext.jsx';

// Etiquetas predefinidas con colores según importancia
const ETIQUETAS_PREDEFINIDAS = [
  { name: 'Examen', color: '#d32f2f', icon: '📝', importancia: 'critica' },
  { name: 'Entrega Obligatoria', color: '#f44336', icon: '⚠️', importancia: 'alta' },
  { name: 'Importante', color: '#ff9800', icon: '🔴', importancia: 'media' },
  { name: 'Proyecto', color: '#9c27b0', icon: '📊', importancia: 'media' },
  { name: 'Práctica', color: '#2196f3', icon: '💻', importancia: 'baja' },
  { name: 'Lectura', color: '#4caf50', icon: '📖', importancia: 'baja' }
];

function GestionEtiquetas({ boardId, usuario, onEtiquetaCreada }) {
  const { isDark } = useTheme();
  const [etiquetas, setEtiquetas] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombreEtiqueta, setNombreEtiqueta] = useState('');
  const [colorEtiqueta, setColorEtiqueta] = useState('#3498db');
  const [editandoId, setEditandoId] = useState(null);
  const [cargando, setCargando] = useState(false);

  // Colores predefinidos para etiquetas personalizadas
  const coloresPredefinidos = [
    '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6',
    '#1abc9c', '#e67e22', '#34495e', '#16a085', '#c0392b',
    '#8e44ad', '#27ae60', '#d35400', '#2980b9', '#7f8c8d'
  ];

  // Cargar etiquetas del board y crear predefinidas si no existen
  useEffect(() => {
    const cargarEtiquetas = async () => {
      if (!boardId) {
        setEtiquetas([]);
        return;
      }

      try {
        setCargando(true);
        const labels = await labelsAPI.getAll(boardId);
        const etiquetasExistentes = Array.isArray(labels) ? labels : [];
        
        // Verificar y crear etiquetas predefinidas que no existan
        const nombresExistentes = etiquetasExistentes.map(e => e.name.toLowerCase());
        const etiquetasACrear = ETIQUETAS_PREDEFINIDAS.filter(
          predef => !nombresExistentes.includes(predef.name.toLowerCase())
        );

        // Crear etiquetas predefinidas faltantes
        if (etiquetasACrear.length > 0) {
          try {
            const nuevasEtiquetas = await Promise.all(
              etiquetasACrear.map(predef =>
                labelsAPI.create({
                  board: boardId,
                  name: predef.name,
                  color: predef.color
                })
              )
            );
            setEtiquetas([...etiquetasExistentes, ...nuevasEtiquetas]);
          } catch (error) {
            console.error('Error al crear etiquetas predefinidas:', error);
            setEtiquetas(etiquetasExistentes);
          }
        } else {
          setEtiquetas(etiquetasExistentes);
        }
      } catch (error) {
        console.error('Error al cargar etiquetas:', error);
        setEtiquetas([]);
      } finally {
        setCargando(false);
      }
    };

    cargarEtiquetas();
  }, [boardId]);

  const crearEtiqueta = async () => {
    if (!nombreEtiqueta.trim()) {
      alert('Por favor, ingresa un nombre para la etiqueta.');
      return;
    }

    if (!boardId) {
      alert('Error: No hay curso seleccionado.');
      return;
    }

    try {
      const nuevaEtiqueta = await labelsAPI.create({
        board: boardId,
        name: nombreEtiqueta.trim(),
        color: colorEtiqueta
      });

      setEtiquetas(prev => [...prev, nuevaEtiqueta]);
      setNombreEtiqueta('');
      setColorEtiqueta('#3498db');
      setMostrarFormulario(false);

      if (onEtiquetaCreada) {
        onEtiquetaCreada();
      }
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      alert('Error al crear la etiqueta. Por favor, intenta nuevamente.');
    }
  };

  const editarEtiqueta = async (id) => {
    const etiqueta = etiquetas.find(e => e.id === id);
    if (!etiqueta) return;

    setEditandoId(id);
    setNombreEtiqueta(etiqueta.name);
    setColorEtiqueta(etiqueta.color);
    setMostrarFormulario(true);
  };

  const guardarEdicion = async () => {
    if (!nombreEtiqueta.trim()) {
      alert('Por favor, ingresa un nombre para la etiqueta.');
      return;
    }

    try {
      const etiquetaActualizada = await labelsAPI.update(editandoId, {
        name: nombreEtiqueta.trim(),
        color: colorEtiqueta
      });

      setEtiquetas(prev => prev.map(e => e.id === editandoId ? etiquetaActualizada : e));
      setNombreEtiqueta('');
      setColorEtiqueta('#3498db');
      setEditandoId(null);
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al editar etiqueta:', error);
      alert('Error al editar la etiqueta. Por favor, intenta nuevamente.');
    }
  };

  const eliminarEtiqueta = async (id) => {
    const etiqueta = etiquetas.find(e => e.id === id);
    if (!etiqueta) return;

    // Verificar si es una etiqueta predefinida
    const esPredefinida = ETIQUETAS_PREDEFINIDAS.some(
      p => p.name.toLowerCase() === etiqueta.name.toLowerCase()
    );

    if (esPredefinida) {
      if (!window.confirm(
        `⚠️ La etiqueta "${etiqueta.name}" es una etiqueta predefinida.\n\n` +
        `Si la eliminas, se volverá a crear automáticamente cuando recargues la página.\n\n` +
        `¿Estás seguro de que quieres eliminarla?`
      )) {
        return;
      }
    } else {
      if (!window.confirm(`¿Estás seguro de que quieres eliminar la etiqueta "${etiqueta.name}"?`)) {
        return;
      }
    }

    try {
      await labelsAPI.delete(id);
      setEtiquetas(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error al eliminar etiqueta:', error);
      alert('Error al eliminar la etiqueta. Por favor, intenta nuevamente.');
    }
  };

  const cancelarFormulario = () => {
    setNombreEtiqueta('');
    setColorEtiqueta('#3498db');
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  // Solo mostrar para docentes
  if (usuario.rol !== 'docente') {
    return null;
  }

  return (
    <div style={{
      background: isDark ? '#2d2d2d' : 'white',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
      border: isDark ? '1px solid #444' : 'none'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3 style={{ margin: 0, color: isDark ? '#fff' : '#333', fontSize: '1.1rem' }}>
          🏷️ Gestión de Etiquetas
        </h3>
        {!mostrarFormulario && (
          <button
            onClick={() => setMostrarFormulario(true)}
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
            ➕ Nueva Etiqueta
          </button>
        )}
      </div>

      {mostrarFormulario && (
        <div style={{
          background: isDark ? '#3d3d3d' : '#f5f5f5',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: isDark ? '#fff' : '#333', fontSize: '0.95rem' }}>
            {editandoId ? '✏️ Editar Etiqueta' : '➕ Nueva Etiqueta'}
          </h4>
          
          <input
            type="text"
            placeholder="Nombre de la etiqueta..."
            value={nombreEtiqueta}
            onChange={(e) => setNombreEtiqueta(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              border: `2px solid ${isDark ? '#555' : '#ddd'}`,
              borderRadius: '5px',
              fontSize: '14px',
              marginBottom: '10px',
              boxSizing: 'border-box',
              background: isDark ? '#2d2d2d' : 'white',
              color: isDark ? '#fff' : '#333'
            }}
          />

          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: isDark ? '#aaa' : '#666', fontSize: '14px' }}>
              Color:
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
              {coloresPredefinidos.map(color => (
                <button
                  key={color}
                  onClick={() => setColorEtiqueta(color)}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: colorEtiqueta === color ? '3px solid #333' : `2px solid ${isDark ? '#555' : '#ddd'}`,
                    background: color,
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title={color}
                />
              ))}
            </div>
            <input
              type="color"
              value={colorEtiqueta}
              onChange={(e) => setColorEtiqueta(e.target.value)}
              style={{
                width: '100%',
                height: '40px',
                border: `2px solid ${isDark ? '#555' : '#ddd'}`,
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={editandoId ? guardarEdicion : crearEtiqueta}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                flex: 1
              }}
            >
              {editandoId ? '💾 Guardar' : '➕ Crear'}
            </button>
            <button
              onClick={cancelarFormulario}
              style={{
                background: '#9e9e9e',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px',
                flex: 1
              }}
            >
              ✕ Cancelar
            </button>
          </div>
        </div>
      )}

      {cargando ? (
        <p style={{ color: isDark ? '#aaa' : '#666', textAlign: 'center', padding: '20px' }}>
          Cargando etiquetas...
        </p>
      ) : etiquetas.length === 0 ? (
        <p style={{ color: isDark ? '#777' : '#999', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
          No hay etiquetas creadas aún. Crea una nueva etiqueta para comenzar.
        </p>
      ) : (
        <div>
          {/* Etiquetas predefinidas */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              margin: '0 0 10px 0', 
              color: isDark ? '#fff' : '#333', 
              fontSize: '0.9rem',
              fontWeight: 'bold'
            }}>
              🏷️ Etiquetas Predefinidas (por importancia)
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {etiquetas
                .filter(e => ETIQUETAS_PREDEFINIDAS.some(p => p.name.toLowerCase() === e.name.toLowerCase()))
                .sort((a, b) => {
                  const aPredef = ETIQUETAS_PREDEFINIDAS.find(p => p.name.toLowerCase() === a.name.toLowerCase());
                  const bPredef = ETIQUETAS_PREDEFINIDAS.find(p => p.name.toLowerCase() === b.name.toLowerCase());
                  const orden = { 'critica': 0, 'alta': 1, 'media': 2, 'baja': 3 };
                  return (orden[aPredef?.importancia] ?? 4) - (orden[bPredef?.importancia] ?? 4);
                })
                .map(etiqueta => {
                  const predef = ETIQUETAS_PREDEFINIDAS.find(p => p.name.toLowerCase() === etiqueta.name.toLowerCase());
                  const esExamen = etiqueta.name.toLowerCase() === 'examen';
                  return (
                    <div
                      key={etiqueta.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: esExamen 
                          ? `${etiqueta.color}20` 
                          : (isDark ? '#3d3d3d' : '#f5f5f5'),
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: `2px solid ${etiqueta.color}`,
                        boxShadow: esExamen ? `0 2px 8px ${etiqueta.color}40` : 'none',
                        fontWeight: esExamen ? 'bold' : 'normal'
                      }}
                    >
                      <span style={{ fontSize: '16px' }}>
                        {predef?.icon || '🏷️'}
                      </span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: etiqueta.color,
                          border: `1px solid ${isDark ? '#555' : '#ddd'}`
                        }}
                      />
                      <span style={{ 
                        color: isDark ? '#fff' : '#333', 
                        fontSize: '14px', 
                        fontWeight: esExamen ? 'bold' : 'normal'
                      }}>
                        {etiqueta.name}
                      </span>
                      <button
                        onClick={() => editarEtiqueta(etiqueta.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0',
                          color: isDark ? '#aaa' : '#666'
                        }}
                        title="Editar etiqueta"
                      >
                        ✏️
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Etiquetas personalizadas */}
          {etiquetas.filter(e => 
            !ETIQUETAS_PREDEFINIDAS.some(p => p.name.toLowerCase() === e.name.toLowerCase())
          ).length > 0 && (
            <div>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                color: isDark ? '#fff' : '#333', 
                fontSize: '0.9rem',
                fontWeight: 'bold'
              }}>
                ✨ Etiquetas Personalizadas
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {etiquetas
                  .filter(e => !ETIQUETAS_PREDEFINIDAS.some(p => p.name.toLowerCase() === e.name.toLowerCase()))
                  .map(etiqueta => (
                    <div
                      key={etiqueta.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: isDark ? '#3d3d3d' : '#f5f5f5',
                        padding: '8px 12px',
                        borderRadius: '20px',
                        border: `2px solid ${etiqueta.color}`
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-block',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: etiqueta.color,
                          border: `1px solid ${isDark ? '#555' : '#ddd'}`
                        }}
                      />
                      <span style={{ color: isDark ? '#fff' : '#333', fontSize: '14px', fontWeight: 'bold' }}>
                        {etiqueta.name}
                      </span>
                      <button
                        onClick={() => editarEtiqueta(etiqueta.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0',
                          color: isDark ? '#aaa' : '#666'
                        }}
                        title="Editar etiqueta"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => eliminarEtiqueta(etiqueta.id)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '16px',
                          padding: '0',
                          color: '#f44336'
                        }}
                        title="Eliminar etiqueta"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GestionEtiquetas;

