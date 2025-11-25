import { useState } from 'react';
import { boardsAPI, listsAPI, cardsAPI, labelsAPI } from './api';
import { useTheme } from './ThemeContext.jsx';

// Etiquetas predefinidas
const ETIQUETAS_PREDEFINIDAS = [
  { name: 'Examen', color: '#d32f2f', icon: '📝' },
  { name: 'Entrega Obligatoria', color: '#f44336', icon: '⚠️' },
  { name: 'Importante', color: '#ff9800', icon: '🔴' },
  { name: 'Proyecto', color: '#9c27b0', icon: '📊' },
  { name: 'Práctica', color: '#2196f3', icon: '💻' },
  { name: 'Lectura', color: '#4caf50', icon: '📖' }
];

function NuevaTarea({ setTareas, cursoId, estudiantes, usuario, onActividad, listsMap, boardId, onTareaCreada, etiquetas = [] }) {
  const { isDark } = useTheme();
  const [texto, setTexto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState([]);
  const [fechaVencimiento, setFechaVencimiento] = useState('');
  const [etiquetasSeleccionadas, setEtiquetasSeleccionadas] = useState([]);
  const [creandoEtiqueta, setCreandoEtiqueta] = useState(false);
  const [nombreNuevaEtiqueta, setNombreNuevaEtiqueta] = useState('');
  const [colorNuevaEtiqueta, setColorNuevaEtiqueta] = useState('#3498db');

  const estudiantesDelCurso = estudiantes?.filter(e => e.cursoId === cursoId) || [];

  const agregar = async () => {
    if (texto.trim() !== '') {
      // Si no hay estudiantes seleccionados, crear una tarea sin asignar
      const estudiantesParaAsignar = estudiantesSeleccionados.length > 0 
        ? estudiantesSeleccionados 
        : [null]; // null significa sin asignar
      
      try {
        // Usar boardId si está disponible, de lo contrario obtener o crear el board
        let board = null;
        let listaPendienteId = null;
        
        if (boardId && listsMap && listsMap.pendiente) {
          // Usar el board y lista existente
          listaPendienteId = listsMap.pendiente;
          board = { id: boardId };
        } else {
          // Obtener o crear el board (usar el primer board del docente o crear uno)
          let boards = await boardsAPI.getAll();
          board = boards.length > 0 ? boards[0] : null;
          
          // Si no hay board, crear uno con el nombre del curso
          if (!board && cursoId) {
            const cursoNombre = `Curso ${cursoId}`;
            board = await boardsAPI.create({ name: cursoNombre, description: '' });
          }
          
          if (!board) {
            throw new Error('No se pudo obtener o crear el board');
          }
          
          // Obtener la lista "Pendiente" del board
          let lists = await listsAPI.getAll(board.id);
          let listaPendiente = lists.find(l => {
            const titleLower = l.title.toLowerCase();
            return titleLower.includes('pendiente');
          });
          
          // Si no existe la lista "Pendiente", crearla
          if (!listaPendiente) {
            try {
              listaPendiente = await listsAPI.create({
                board: board.id,
                title: 'Pendiente',
                position: 0
              });
            } catch (error) {
              console.error('Error al crear lista Pendiente:', error);
              throw new Error('Error al crear la lista. Por favor, intenta nuevamente.');
            }
          }
          
          listaPendienteId = listaPendiente.id;
        }
        
        // Crear una tarea por cada estudiante seleccionado
        const tareasCreadas = [];
        for (const estudianteId of estudiantesParaAsignar) {
          // Crear la card en el backend
          const cardData = {
            list: listaPendienteId,
            title: texto.trim(),
            description: descripcion.trim(),
            assigned_to_id: estudianteId ? parseInt(estudianteId) : null,
            due_date: fechaVencimiento || null,
            position: 0,
            label_ids: etiquetasSeleccionadas
          };
          
          const cardCreada = await cardsAPI.create(cardData);
          
          // Obtener el nombre del estudiante asignado si existe
          const estudianteAsignado = estudianteId 
            ? estudiantesDelCurso.find(e => (e.userId ? e.userId.toString() : e.id.toString()) === estudianteId.toString())
            : null;
          
          // Crear la tarea local con el ID del backend
          const nuevaTarea = {
            id: cardCreada.id,
            texto: cardCreada.title,
            descripcion: cardCreada.description || '',
            asignadoA: cardCreada.assigned_to ? (cardCreada.assigned_to.username || cardCreada.assigned_to.first_name || '') : null,
            asignadoAId: cardCreada.assigned_to ? cardCreada.assigned_to.id : null,
            fechaVencimiento: cardCreada.due_date || null,
            cursoId: cursoId
          };
          
          tareasCreadas.push(nuevaTarea);
          
          if (onActividad) {
            onActividad('tarea_creada', `Tarea "${texto.trim()}" creada${estudianteAsignado ? ` para ${estudianteAsignado.nombre}` : ''}`, {
              tareaId: nuevaTarea.id,
              asignadoA: estudianteAsignado ? estudianteAsignado.nombre : 'Sin asignar'
            });
          }
        }
        
        // Actualizar estado local inmediatamente con todas las tareas creadas
        setTareas((prev) => ({ 
          ...prev, 
          pendiente: [...prev.pendiente, ...tareasCreadas] 
        }));

        // Notificar al componente padre para que recargue las tareas desde el backend
        if (onTareaCreada) {
          onTareaCreada();
        }
        
        // Limpiar formulario
        setTexto('');
        setDescripcion('');
        setEstudiantesSeleccionados([]);
        setFechaVencimiento('');
        setEtiquetasSeleccionadas([]);
        setCreandoEtiqueta(false);
        setNombreNuevaEtiqueta('');
        setColorNuevaEtiqueta('#3498db');
      } catch (error) {
        console.error('Error al guardar tarea en el backend:', error);
        alert('Error al guardar la tarea. Por favor, intenta nuevamente.');
      }
    }
  };

  return (
    <div style={{ 
      marginBottom: '20px', 
      textAlign: 'center',
      background: isDark ? '#2d2d2d' : 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: isDark ? '0 2px 4px rgba(0, 0, 0, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
      maxWidth: '800px',
      margin: '0 auto 20px auto',
      border: isDark ? '1px solid #444' : 'none',
      transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: isDark ? '#fff' : '#333', fontSize: '1.2rem' }}>
        ➕ Nueva Tarea
      </h3>
      
      <input
        type="text"
        placeholder="Título de la tarea..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && agregar()}
        style={{
          padding: '10px',
          border: `2px solid ${isDark ? '#555' : '#ddd'}`,
          borderRadius: '5px',
          fontSize: '16px',
          width: '100%',
          marginBottom: '10px',
          boxSizing: 'border-box',
          background: isDark ? '#3d3d3d' : 'white',
          color: isDark ? '#fff' : '#333'
        }}
      />
      
      <textarea
        placeholder="Descripción de la tarea (opcional)..."
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        style={{
          padding: '10px',
          border: `2px solid ${isDark ? '#555' : '#ddd'}`,
          borderRadius: '5px',
          fontSize: '14px',
          width: '100%',
          minHeight: '60px',
          resize: 'vertical',
          marginBottom: '10px',
          boxSizing: 'border-box',
          fontFamily: 'Arial, sans-serif',
          background: isDark ? '#3d3d3d' : 'white',
          color: isDark ? '#fff' : '#333'
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {usuario.rol === 'docente' && estudiantesDelCurso.length > 0 && (
          <div>
            <label style={{ display: 'block', marginBottom: '5px', color: isDark ? '#aaa' : '#666', fontSize: '14px', textAlign: 'left' }}>
              Asignar a (puedes seleccionar varios):
            </label>
            <div style={{
              maxHeight: '150px',
              overflowY: 'auto',
              padding: '10px',
              border: `2px solid ${isDark ? '#555' : '#ddd'}`,
              borderRadius: '5px',
              background: isDark ? '#3d3d3d' : 'white',
              fontSize: '14px'
            }}>
              {estudiantesDelCurso.map(est => {
                const estudianteId = est.userId ? est.userId.toString() : est.id.toString();
                const estaSeleccionado = estudiantesSeleccionados.includes(estudianteId);
                return (
                  <label
                    key={est.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 0',
                      cursor: 'pointer',
                      color: isDark ? '#fff' : '#333'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={estaSeleccionado}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setEstudiantesSeleccionados([...estudiantesSeleccionados, estudianteId]);
                        } else {
                          setEstudiantesSeleccionados(estudiantesSeleccionados.filter(id => id !== estudianteId));
                        }
                      }}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer'
                      }}
                    />
                    <span>{est.nombre}</span>
                  </label>
                );
              })}
            </div>
            {estudiantesSeleccionados.length > 0 && (
              <p style={{ 
                margin: '5px 0 0 0', 
                fontSize: '12px', 
                color: isDark ? '#4caf50' : '#2e7d32',
                fontWeight: 'bold'
              }}>
                {estudiantesSeleccionados.length} estudiante{estudiantesSeleccionados.length > 1 ? 's' : ''} seleccionado{estudiantesSeleccionados.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: isDark ? '#aaa' : '#666', fontSize: '14px', textAlign: 'left' }}>
            Fecha de vencimiento:
          </label>
          <input
            type="date"
            value={fechaVencimiento}
            onChange={(e) => setFechaVencimiento(e.target.value)}
            style={{
              padding: '10px',
              border: `2px solid ${isDark ? '#555' : '#ddd'}`,
              borderRadius: '5px',
              fontSize: '14px',
              width: '100%',
              boxSizing: 'border-box',
              background: isDark ? '#3d3d3d' : 'white',
              color: isDark ? '#fff' : '#333'
            }}
          />
        </div>
      </div>

      {/* Selector de etiquetas para docentes */}
      {usuario.rol === 'docente' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '8px', 
            color: isDark ? '#aaa' : '#666', 
            fontSize: '14px',
            fontWeight: 'bold'
          }}>
            🏷️ Etiquetas:
          </label>
          
          {/* Etiquetas disponibles */}
          {etiquetas.length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              marginBottom: '10px',
              padding: '10px',
              background: isDark ? '#3d3d3d' : '#f5f5f5',
              borderRadius: '8px'
            }}>
              {etiquetas.map(etiqueta => {
                const estaSeleccionada = etiquetasSeleccionadas.includes(etiqueta.id);
                const predef = ETIQUETAS_PREDEFINIDAS.find(p => p.name.toLowerCase() === etiqueta.name.toLowerCase());
                return (
                  <button
                    key={etiqueta.id}
                    type="button"
                    onClick={() => {
                      if (estaSeleccionada) {
                        setEtiquetasSeleccionadas(prev => prev.filter(id => id !== etiqueta.id));
                      } else {
                        setEtiquetasSeleccionadas(prev => [...prev, etiqueta.id]);
                      }
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
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
                        width: '10px',
                        height: '10px',
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
              onClick={() => setCreandoEtiqueta(true)}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              ➕ Crear nueva etiqueta
            </button>
          ) : (
            <div style={{
              padding: '12px',
              background: isDark ? '#3d3d3d' : 'white',
              borderRadius: '8px',
              border: `2px solid ${isDark ? '#555' : '#ddd'}`
            }}>
              <input
                type="text"
                placeholder="Nombre de la etiqueta..."
                value={nombreNuevaEtiqueta}
                onChange={(e) => setNombreNuevaEtiqueta(e.target.value)}
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
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                <input
                  type="color"
                  value={colorNuevaEtiqueta}
                  onChange={(e) => setColorNuevaEtiqueta(e.target.value)}
                  style={{
                    width: '60px',
                    height: '40px',
                    border: `2px solid ${isDark ? '#555' : '#ddd'}`,
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ flex: 1, fontSize: '12px', color: isDark ? '#aaa' : '#666' }}>
                  Selecciona un color para la etiqueta
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={async () => {
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

                      setEtiquetasSeleccionadas(prev => [...prev, nuevaEtiqueta.id]);
                      setCreandoEtiqueta(false);
                      setNombreNuevaEtiqueta('');
                      setColorNuevaEtiqueta('#3498db');
                      
                      // Recargar etiquetas si hay callback
                      if (onTareaCreada) {
                        onTareaCreada();
                      }
                    } catch (error) {
                      console.error('Error al crear etiqueta:', error);
                      alert('Error al crear la etiqueta. Por favor, intenta nuevamente.');
                    }
                  }}
                  style={{
                    background: '#4caf50',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    flex: 1
                  }}
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreandoEtiqueta(false);
                    setNombreNuevaEtiqueta('');
                    setColorNuevaEtiqueta('#3498db');
                  }}
                  style={{
                    background: '#9e9e9e',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px',
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
      
      <button 
        onClick={agregar}
        style={{
          background: '#4caf50',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          fontSize: '16px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        Agregar Tarea
      </button>
    </div>
  );
}

export default NuevaTarea;
