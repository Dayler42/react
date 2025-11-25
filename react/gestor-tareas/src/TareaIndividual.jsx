import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTheme } from './ThemeContext.jsx';
import Comentarios from './Comentarios.jsx';
import { cardsAPI, labelsAPI, commentsAPI } from './api';

// Etiquetas predefinidas
const ETIQUETAS_PREDEFINIDAS = [
  { name: 'Examen', color: '#d32f2f', icon: '📝' },
  { name: 'Entrega Obligatoria', color: '#f44336', icon: '⚠️' },
  { name: 'Importante', color: '#ff9800', icon: '🔴' },
  { name: 'Proyecto', color: '#9c27b0', icon: '📊' },
  { name: 'Práctica', color: '#2196f3', icon: '💻' },
  { name: 'Lectura', color: '#4caf50', icon: '📖' }
];

function TareaIndividual({ tarea, onEditar, onEliminar, onMover, onAsignar, estado, usuario, etiquetas = [], onTareaActualizada, boardId }) {
  const { isDark } = useTheme();
  const [editando, setEditando] = useState(false);
  const [nuevoTexto, setNuevoTexto] = useState(tarea.texto);
  const [nuevaDescripcion, setNuevaDescripcion] = useState(tarea.descripcion || '');
  const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState(tarea.fechaVencimiento || '');
  const [nuevasEtiquetasSeleccionadas, setNuevasEtiquetasSeleccionadas] = useState(
    (tarea.labels || []).map(l => typeof l === 'object' ? l.id : l)
  );
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [nombreNuevaEtiqueta, setNombreNuevaEtiqueta] = useState('');
  const [colorNuevaEtiqueta, setColorNuevaEtiqueta] = useState('#3498db');
  // Asegurar que asignadoA sea siempre un string
  const getAsignadoAString = (asignadoA) => {
    if (!asignadoA) return '';
    if (typeof asignadoA === 'string') return asignadoA;
    if (typeof asignadoA === 'object') return asignadoA?.nombre || asignadoA?.username || '';
    return String(asignadoA);
  };
  
  const [nuevoAsignadoA, setNuevoAsignadoA] = useState(getAsignadoAString(tarea.asignadoA));
  const [calificacion, setCalificacion] = useState(tarea.grade || '');
  const [comentarioCalificacion, setComentarioCalificacion] = useState('');
  const [calificando, setCalificando] = useState(false);

  // Deshabilitar drag and drop para docentes
  const dragEnabled = usuario.rol !== 'docente';
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: tarea.id.toString(),
    disabled: !dragEnabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.3 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const guardarEdicion = async () => {
    try {
      console.log('guardarEdicion llamado para tarea:', tarea.id);
      console.log('nuevoTexto:', nuevoTexto);
      console.log('onEditar:', onEditar);
      
      if (!nuevoTexto || nuevoTexto.trim() === '') {
        alert('El título de la tarea no puede estar vacío.');
        return;
      }

      if (!onEditar) {
        console.error('Error: función onEditar no está definida');
        alert('Error: No se puede editar la tarea. Por favor, recarga la página.');
        return;
      }

      console.log('Guardando edición de tarea:', tarea.id);
      console.log('Datos a guardar:', {
        texto: nuevoTexto.trim(),
        descripcion: nuevaDescripcion.trim(),
        fechaVencimiento: nuevaFechaVencimiento || null,
        asignadoA: nuevoAsignadoA ? nuevoAsignadoA.trim() : null
      });
      
      await onEditar(tarea.id, {
        texto: nuevoTexto.trim(),
        descripcion: nuevaDescripcion.trim(),
        fechaVencimiento: nuevaFechaVencimiento || null,
        asignadoA: nuevoAsignadoA ? nuevoAsignadoA.trim() : null,
        label_ids: nuevasEtiquetasSeleccionadas
      });
      
      console.log('Edición guardada exitosamente');
      setEditando(false);
    } catch (error) {
      console.error('Error al guardar edición:', error);
      console.error('Error completo:', error.response);
      alert('Error al guardar los cambios. Por favor, intenta nuevamente.');
    }
  };

  const cancelarEdicion = () => {
    setNuevoTexto(tarea.texto);
    setNuevaDescripcion(tarea.descripcion || '');
    setNuevaFechaVencimiento(tarea.fechaVencimiento || '');
    setNuevoAsignadoA(getAsignadoAString(tarea.asignadoA));
    setNuevasEtiquetasSeleccionadas((tarea.labels || []).map(l => typeof l === 'object' ? l.id : l));
    setEditando(false);
    setCreandoEtiqueta(false);
    setNombreNuevaEtiqueta('');
    setColorNuevaEtiqueta('#3498db');
  };

  const esProximaAVencer = () => {
    if (!tarea.fechaVencimiento) return false;
    const ahora = new Date();
    const fechaVenc = new Date(tarea.fechaVencimiento);
    const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
    return diasRestantes <= 7 && diasRestantes >= 0;
  };

  const estaVencida = () => {
    if (!tarea.fechaVencimiento) return false;
    const ahora = new Date();
    const fechaVenc = new Date(tarea.fechaVencimiento);
    return fechaVenc < ahora && estado !== 'completada';
  };

  // Obtener etiquetas asignadas a esta tarea
  const etiquetasAsignadas = (tarea.labels || []).map(labelId => {
    if (typeof labelId === 'object') return labelId;
    return etiquetas.find(e => e.id === labelId);
  }).filter(e => e);

  // Toggle etiqueta (asignar/desasignar)
  const toggleEtiqueta = async (etiquetaId) => {
    if (usuario.rol !== 'docente') return;

    try {
      const etiquetasActuales = (tarea.labels || []).map(l => typeof l === 'object' ? l.id : l);
      const tieneEtiqueta = etiquetasActuales.includes(etiquetaId);
      
      let nuevasEtiquetasIds;
      if (tieneEtiqueta) {
        // Desasignar etiqueta
        nuevasEtiquetasIds = etiquetasActuales.filter(id => id !== etiquetaId);
      } else {
        // Asignar etiqueta
        nuevasEtiquetasIds = [...etiquetasActuales, etiquetaId];
      }

      // Actualizar en el backend
      await cardsAPI.update(tarea.id, {
        label_ids: nuevasEtiquetasIds
      });

      // Recargar tareas desde el backend para actualizar el estado
      if (onTareaActualizada) {
        onTareaActualizada();
      }
    } catch (error) {
      console.error('Error al actualizar etiquetas:', error);
      alert('Error al actualizar las etiquetas. Por favor, intenta nuevamente.');
    }
  };

  // Crear nueva etiqueta
  const crearNuevaEtiqueta = async () => {
    if (!nombreNuevaEtiqueta.trim()) {
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
        name: nombreNuevaEtiqueta.trim(),
        color: colorNuevaEtiqueta
      });

      // Asignar la nueva etiqueta a la tarea
      const etiquetasActuales = (tarea.labels || []).map(l => typeof l === 'object' ? l.id : l);
      await cardsAPI.update(tarea.id, {
        label_ids: [...etiquetasActuales, nuevaEtiqueta.id]
      });

      setNombreNuevaEtiqueta('');
      setColorNuevaEtiqueta('#3498db');
      setCreandoEtiqueta(false);

      // Recargar tareas
      if (onTareaActualizada) {
        onTareaActualizada();
      }
    } catch (error) {
      console.error('Error al crear etiqueta:', error);
      alert('Error al crear la etiqueta. Por favor, intenta nuevamente.');
    }
  };

  // Guardar calificación
  const guardarCalificacion = async () => {
    if (!calificacion) {
      alert('Por favor, selecciona una calificación.');
      return;
    }

    try {
      // Guardar la calificación en la card
      await cardsAPI.update(tarea.id, {
        grade: calificacion
      });

      // Si hay un comentario, crearlo automáticamente
      if (comentarioCalificacion.trim()) {
        try {
          const calInfo = getCalificacionInfo(calificacion);
          const textoComentario = `📊 Calificación: ${calInfo ? calInfo.texto : calificacion}\n\n${comentarioCalificacion.trim()}`;
          
          await commentsAPI.create({
            card: tarea.id,
            content: textoComentario
          });
        } catch (error) {
          console.error('Error al crear comentario de calificación:', error);
          // No mostrar error al usuario, la calificación ya se guardó
        }
      }

      setCalificando(false);
      setComentarioCalificacion('');
      
      // Recargar tareas
      if (onTareaActualizada) {
        onTareaActualizada();
      }
    } catch (error) {
      console.error('Error al guardar calificación:', error);
      alert('Error al guardar la calificación. Por favor, intenta nuevamente.');
    }
  };

  // Obtener información de la calificación
  const getCalificacionInfo = (grade) => {
    const calificacionesMap = {
      'bueno': { color: '#4caf50', emoji: '✅', texto: 'Bueno' },
      'malo': { color: '#f44336', emoji: '❌', texto: 'Malo' },
      'pesimo': { color: '#d32f2f', emoji: '⚠️', texto: 'Pésimo' },
      'necesita_mejorar': { color: '#ff9800', emoji: '⚠️', texto: 'Necesita Mejorar' }
    };
    return calificacionesMap[grade] || null;
  };

  if (editando) {
    return (
      <div style={{ 
        background: isDark ? '#3d3d3d' : 'white', 
        margin: '10px 0', 
        padding: '12px', 
        borderRadius: '8px',
        boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: '2px solid #2196f3'
      }}>
        <input
          type="text"
          value={nuevoTexto}
          onChange={(e) => setNuevoTexto(e.target.value)}
          placeholder="Título de la tarea"
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${isDark ? '#555' : '#ddd'}`,
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '8px',
            boxSizing: 'border-box',
            background: isDark ? '#2d2d2d' : 'white',
            color: isDark ? '#fff' : '#333'
          }}
        />
        <textarea
          value={nuevaDescripcion}
          onChange={(e) => setNuevaDescripcion(e.target.value)}
          placeholder="Descripción de la tarea (opcional)"
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${isDark ? '#555' : '#ddd'}`,
            borderRadius: '4px',
            fontSize: '14px',
            minHeight: '60px',
            resize: 'vertical',
            marginBottom: '8px',
            boxSizing: 'border-box',
            fontFamily: 'Arial, sans-serif',
            background: isDark ? '#2d2d2d' : 'white',
            color: isDark ? '#fff' : '#333'
          }}
        />
        <input
          type="date"
          value={nuevaFechaVencimiento}
          onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
          style={{
            width: '100%',
            padding: '8px',
            border: `1px solid ${isDark ? '#555' : '#ddd'}`,
            borderRadius: '4px',
            fontSize: '14px',
            marginBottom: '8px',
            boxSizing: 'border-box',
            background: isDark ? '#2d2d2d' : 'white',
            color: isDark ? '#fff' : '#333'
          }}
        />

        {/* Selector de etiquetas en edición */}
        {usuario.rol === 'docente' && (
          <div style={{ marginBottom: '8px' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '6px', 
              color: isDark ? '#aaa' : '#666', 
              fontSize: '12px',
              fontWeight: 'bold'
            }}>
              🏷️ Etiquetas:
            </label>
            
            {/* Etiquetas disponibles */}
            {etiquetas.length > 0 && (
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px',
                marginBottom: '8px',
                padding: '8px',
                background: isDark ? '#2d2d2d' : '#f5f5f5',
                borderRadius: '6px'
              }}>
                {etiquetas.map(etiqueta => {
                  const estaSeleccionada = nuevasEtiquetasSeleccionadas.includes(etiqueta.id);
                  const predef = ETIQUETAS_PREDEFINIDAS.find(p => p.name.toLowerCase() === etiqueta.name.toLowerCase());
                  return (
                    <button
                      key={etiqueta.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (estaSeleccionada) {
                          setNuevasEtiquetasSeleccionadas(prev => prev.filter(id => id !== etiqueta.id));
                        } else {
                          setNuevasEtiquetasSeleccionadas(prev => [...prev, etiqueta.id]);
                        }
                      }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '6px 10px',
                        borderRadius: '12px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        border: `2px solid ${etiqueta.color}`,
                        background: estaSeleccionada ? etiqueta.color : 'transparent',
                        color: estaSeleccionada ? 'white' : etiqueta.color,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      {predef?.icon && <span>{predef.icon}</span>}
                      <span
                        style={{
                          display: 'inline-block',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: estaSeleccionada ? 'white' : etiqueta.color
                        }}
                      />
                      {etiqueta.name}
                      {estaSeleccionada && ' ✓'}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Crear nueva etiqueta */}
            {!creandoEtiqueta ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCreandoEtiqueta(true);
                }}
                style={{
                  background: '#4caf50',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 'bold'
                }}
              >
                ➕ Crear nueva etiqueta
              </button>
            ) : (
              <div style={{
                padding: '10px',
                background: isDark ? '#3d3d3d' : 'white',
                borderRadius: '6px',
                border: `1px solid ${isDark ? '#555' : '#ddd'}`
              }}>
                <input
                  type="text"
                  placeholder="Nombre de la etiqueta..."
                  value={nombreNuevaEtiqueta}
                  onChange={(e) => setNombreNuevaEtiqueta(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: `1px solid ${isDark ? '#555' : '#ddd'}`,
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '8px',
                    boxSizing: 'border-box',
                    background: isDark ? '#2d2d2d' : 'white',
                    color: isDark ? '#fff' : '#333'
                  }}
                />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="color"
                    value={colorNuevaEtiqueta}
                    onChange={(e) => setColorNuevaEtiqueta(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '50px',
                      height: '30px',
                      border: `1px solid ${isDark ? '#555' : '#ddd'}`,
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  />
                  <div style={{ flex: 1, fontSize: '10px', color: isDark ? '#aaa' : '#666', display: 'flex', alignItems: 'center' }}>
                    Selecciona un color
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      crearNuevaEtiqueta();
                    }}
                    style={{
                      background: '#4caf50',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      flex: 1
                    }}
                  >
                    Crear
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCreandoEtiqueta(false);
                      setNombreNuevaEtiqueta('');
                      setColorNuevaEtiqueta('#3498db');
                    }}
                    style={{
                      background: '#9e9e9e',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      flex: 1
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              guardarEdicion();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: '#4caf50',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative'
            }}
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              cancelarEdicion();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              pointerEvents: 'auto',
              zIndex: 10,
              position: 'relative'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  const getBackgroundColor = () => {
    if (estaVencida()) {
      return isDark ? '#4a1a1a' : '#ffebee';
    }
    return isDark ? '#3d3d3d' : 'white';
  };

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        ...style,
        background: getBackgroundColor(), 
        margin: '10px 0', 
        padding: '12px', 
        borderRadius: '8px',
        boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
        border: estaVencida() ? '2px solid #f44336' : esProximaAVencer() ? '2px solid #ff9800' : `1px solid ${isDark ? '#555' : '#e0e0e0'}`,
        cursor: dragEnabled ? (isDragging ? 'grabbing' : 'grab') : 'default',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}
      {...attributes}
      {...(dragEnabled ? listeners : {})}
    >
      <h4 style={{ 
        margin: '0 0 8px 0', 
        fontSize: '14px', 
        color: isDark ? '#fff' : '#333',
        fontWeight: 'bold'
      }}>
        {tarea.texto}
      </h4>
      
      {tarea.descripcion && (
        <p style={{ 
          margin: '0 0 10px 0', 
          fontSize: '12px', 
          color: isDark ? '#aaa' : '#666',
          fontStyle: 'italic',
          lineHeight: '1.4'
        }}>
          {tarea.descripcion}
        </p>
      )}

      {tarea.asignadoA && (
        <p style={{ 
          margin: '0 0 8px 0', 
          fontSize: '11px', 
          color: '#1976d2',
          fontWeight: 'bold'
        }}>
          👤 Asignado a: {typeof tarea.asignadoA === 'object' 
            ? (tarea.asignadoA?.nombre || tarea.asignadoA?.username || '') 
            : (tarea.asignadoA || '')
          }
        </p>
      )}

      {tarea.fechaVencimiento && (
        <p style={{ 
          margin: '0 0 8px 0', 
          fontSize: '11px', 
          color: estaVencida() ? '#f44336' : esProximaAVencer() ? '#ff9800' : (isDark ? '#aaa' : '#666'),
          fontWeight: estaVencida() || esProximaAVencer() ? 'bold' : 'normal'
        }}>
          ⏰ Vence: {new Date(tarea.fechaVencimiento).toLocaleDateString('es-ES')}
          {estaVencida() && ' ⚠️ VENCIDA'}
          {esProximaAVencer() && !estaVencida() && ' ⚡ Próxima a vencer'}
        </p>
      )}

      {/* Etiquetas asignadas */}
      {etiquetasAsignadas.length > 0 && (
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '6px', 
          marginBottom: '8px' 
        }}>
          {etiquetasAsignadas
            .sort((a, b) => {
              // Ordenar: Examen primero, luego por importancia
              const esExamenA = a.name.toLowerCase() === 'examen';
              const esExamenB = b.name.toLowerCase() === 'examen';
              if (esExamenA && !esExamenB) return -1;
              if (!esExamenA && esExamenB) return 1;
              return 0;
            })
            .map(etiqueta => {
              const esExamen = etiqueta.name.toLowerCase() === 'examen';
              const esEntregaObligatoria = etiqueta.name.toLowerCase() === 'entrega obligatoria';
              const esImportante = etiqueta.name.toLowerCase() === 'importante';
              
              // Iconos según el tipo de etiqueta
              const iconos = {
                'examen': '📝',
                'entrega obligatoria': '⚠️',
                'importante': '🔴',
                'proyecto': '📊',
                'práctica': '💻',
                'lectura': '📖'
              };
              const icono = iconos[etiqueta.name.toLowerCase()] || '🏷️';

              return (
                <span
                  key={etiqueta.id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: esExamen ? '6px 10px' : '4px 8px',
                    borderRadius: '12px',
                    fontSize: esExamen ? '12px' : '11px',
                    fontWeight: esExamen || esEntregaObligatoria || esImportante ? 'bold' : 'normal',
                    background: esExamen 
                      ? `${etiqueta.color}30` 
                      : `${etiqueta.color}20`,
                    border: `2px solid ${etiqueta.color}`,
                    color: esExamen ? etiqueta.color : etiqueta.color,
                    cursor: usuario.rol === 'docente' ? 'pointer' : 'default',
                    boxShadow: esExamen ? `0 2px 4px ${etiqueta.color}40` : 'none',
                    transform: esExamen ? 'scale(1.05)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                  onClick={(e) => {
                    if (usuario.rol === 'docente') {
                      e.stopPropagation();
                      toggleEtiqueta(etiqueta.id);
                    }
                  }}
                  title={usuario.rol === 'docente' ? 'Clic para desasignar' : etiqueta.name}
                >
                  <span style={{ fontSize: esExamen ? '14px' : '12px' }}>
                    {icono}
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: esExamen ? '10px' : '8px',
                      height: esExamen ? '10px' : '8px',
                      borderRadius: '50%',
                      background: etiqueta.color
                    }}
                  />
                  {etiqueta.name}
                </span>
              );
            })}
        </div>
      )}

      {/* Calificación - Solo para tareas completadas */}
      {estado === 'completada' && (
        <div 
          style={{ marginBottom: '10px' }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {tarea.grade ? (
            // Mostrar calificación existente
            (() => {
              const calInfo = getCalificacionInfo(tarea.grade);
              if (!calInfo) return null;
              return (
                <div style={{
                  padding: '8px 12px',
                  background: `${calInfo.color}20`,
                  borderRadius: '6px',
                  border: `2px solid ${calInfo.color}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span style={{ fontSize: '16px' }}>{calInfo.emoji}</span>
                  <span style={{
                    color: calInfo.color,
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}>
                    Calificación: {calInfo.texto}
                  </span>
                  {usuario.rol === 'docente' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                        setCalificando(true);
                        setCalificacion(tarea.grade);
                        setComentarioCalificacion('');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      style={{
                        marginLeft: '8px',
                        background: 'transparent',
                        border: `1px solid ${calInfo.color}`,
                        color: calInfo.color,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        zIndex: 1000,
                        position: 'relative'
                      }}
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              );
            })()
          ) : (
            // Mostrar selector de calificación (solo para docentes)
            usuario.rol === 'docente' && (
              calificando ? (
                <div style={{
                  padding: '10px',
                  background: isDark ? '#3d3d3d' : '#f5f5f5',
                  borderRadius: '6px',
                  border: `1px solid ${isDark ? '#555' : '#ddd'}`
                }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '6px',
                    color: isDark ? '#aaa' : '#666',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    📊 Calificar tarea:
                  </label>
                  <select
                    value={calificacion}
                    onChange={(e) => {
                      e.stopPropagation();
                      setCalificacion(e.target.value);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: `1px solid ${isDark ? '#555' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '13px',
                      marginBottom: '8px',
                      background: isDark ? '#2d2d2d' : 'white',
                      color: isDark ? '#fff' : '#333',
                      cursor: 'pointer',
                      pointerEvents: 'auto',
                      zIndex: 1000,
                      position: 'relative'
                    }}
                  >
                    <option value="">Selecciona una calificación</option>
                    <option value="bueno">✅ Bueno</option>
                    <option value="malo">❌ Malo</option>
                    <option value="pesimo">⚠️ Pésimo</option>
                    <option value="necesita_mejorar">⚠️ Necesita Mejorar</option>
                  </select>
                  
                  <label style={{
                    display: 'block',
                    marginTop: '10px',
                    marginBottom: '6px',
                    color: isDark ? '#aaa' : '#666',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    💬 Nota/Comentario (opcional):
                  </label>
                  <textarea
                    value={comentarioCalificacion}
                    onChange={(e) => {
                      e.stopPropagation();
                      setComentarioCalificacion(e.target.value);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Escribe una nota o comentario sobre la calificación..."
                    style={{
                      width: '100%',
                      padding: '6px',
                      border: `1px solid ${isDark ? '#555' : '#ddd'}`,
                      borderRadius: '4px',
                      fontSize: '12px',
                      minHeight: '60px',
                      resize: 'vertical',
                      marginBottom: '8px',
                      background: isDark ? '#2d2d2d' : 'white',
                      color: isDark ? '#fff' : '#333',
                      fontFamily: 'Arial, sans-serif',
                      boxSizing: 'border-box',
                      pointerEvents: 'auto',
                      zIndex: 1000,
                      position: 'relative'
                    }}
                  />
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                        guardarCalificacion();
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      style={{
                        background: '#4caf50',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1,
                        pointerEvents: 'auto',
                        zIndex: 1000,
                        position: 'relative'
                      }}
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                        setCalificando(false);
                        setCalificacion('');
                        setComentarioCalificacion('');
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        e.nativeEvent?.stopImmediatePropagation();
                      }}
                      style={{
                        background: '#9e9e9e',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        flex: 1,
                        pointerEvents: 'auto',
                        zIndex: 1000,
                        position: 'relative'
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.nativeEvent?.stopImmediatePropagation();
                    setCalificando(true);
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.nativeEvent?.stopImmediatePropagation();
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    e.nativeEvent?.stopImmediatePropagation();
                  }}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    pointerEvents: 'auto',
                    zIndex: 1000,
                    position: 'relative'
                  }}
                >
                  📊 Calificar
                </button>
              )
            )
          )}
        </div>
      )}

      
      {dragEnabled && (
        <p style={{ 
          margin: '0 0 10px 0', 
          fontSize: '10px', 
          color: isDark ? '#777' : '#999',
          fontStyle: 'italic'
        }}>
          💡 Arrastra para mover entre columnas
        </p>
      )}
      
      {/* Componente de comentarios */}
      <Comentarios cardId={tarea.id} usuario={usuario} />
      
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '5px', flexWrap: 'wrap' }}>
        {usuario.rol === 'docente' && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent?.stopImmediatePropagation();
                console.log('Botón editar clickeado para tarea:', tarea.id);
                setEditando(true);
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
              }}
              style={{
                background: '#2196f3',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
              onMouseOver={(e) => e.target.style.background = '#1976d2'}
              onMouseOut={(e) => e.target.style.background = '#2196f3'}
            >
              ✏️ Editar
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                e.nativeEvent?.stopImmediatePropagation();
                console.log('Botón eliminar clickeado para tarea:', tarea.id);
                console.log('onEliminar:', onEliminar);
                if (onEliminar && typeof onEliminar === 'function') {
                  console.log('Llamando a onEliminar con id:', tarea.id);
                  onEliminar(tarea.id);
                } else {
                  console.error('Error: función onEliminar no está definida');
                  alert('Error: No se puede eliminar la tarea. Por favor, recarga la página.');
                }
              }}
              onPointerDown={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
              }}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.nativeEvent?.stopImmediatePropagation();
              }}
              style={{
                background: '#f44336',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'background 0.2s',
                pointerEvents: 'auto',
                zIndex: 10,
                position: 'relative'
              }}
              onMouseOver={(e) => e.target.style.background = '#d32f2f'}
              onMouseOut={(e) => e.target.style.background = '#f44336'}
            >
              🗑️ Eliminar
            </button>
          </>
        )}
      </div>
      
    </div>
  );
}

export default TareaIndividual;
