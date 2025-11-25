import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TareaIndividual from './TareaIndividual.jsx';
import { useTheme } from './ThemeContext.jsx';
import { cardsAPI } from './api';

function Columna({ titulo, tareas, setTareas, estado, usuario, onActividad, listsMap, cursoId, onTareaMovida, etiquetas }) {
  const { isDark } = useTheme();
  const { setNodeRef } = useDroppable({
    id: estado,
  });

  const moverTarea = async (tarea, destino) => {
    try {
      if (!tarea || !destino) {
        console.error('Error: tarea o destino no definidos', { tarea, destino });
        alert('Error: No se pudo mover la tarea. Por favor, intenta nuevamente.');
        return;
      }

      // Obtener el ID de la lista destino
      if (!listsMap || !listsMap[destino]) {
        console.error('Lista destino no encontrada para el estado:', destino, 'listsMap:', listsMap);
        alert('Error: No se pudo encontrar la lista de destino. Por favor, recarga la página.');
        return;
      }
      
      const listaDestinoId = listsMap[destino];
      try {
        await cardsAPI.update(tarea.id, {
          list: listaDestinoId
        });
        
        // Actualizar el estado local inmediatamente para mejor UX
        setTareas((prev) => {
          const nuevas = { ...prev };
          // Remover de estado actual
          Object.keys(nuevas).forEach(key => {
            nuevas[key] = nuevas[key].filter((t) => t.id !== tarea.id);
          });
          // Agregar al destino
          nuevas[destino] = [...nuevas[destino], tarea];
          return nuevas;
        });
        
        // Notificar al componente padre para que recargue las tareas desde el backend
        if (onTareaMovida) {
          onTareaMovida();
        }
      } catch (error) {
        console.error('Error al actualizar tarea en el backend:', error);
        alert('Error al guardar el movimiento de la tarea. Por favor, intenta nuevamente.');
        return;
      }

      if (onActividad) {
        const nombresEstados = {
          'pendiente': 'Pendiente',
          'progreso': 'En Progreso',
          'completada': 'Completada'
        };
        onActividad('tarea_movida', `Tarea "${tarea.texto}" movida a ${nombresEstados[destino]}`, {
          tareaId: tarea.id,
          estadoAnterior: estado,
          estadoNuevo: destino
        });
      }
    } catch (error) {
      console.error('Error al mover tarea:', error);
      
      // Mostrar error más descriptivo
      let mensajeError = 'Error al mover la tarea. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para mover esta tarea.';
        } else if (status === 404) {
          mensajeError += 'La tarea no fue encontrada.';
        } else if (status === 400) {
          mensajeError += data?.detail || data?.message || 'Datos inválidos.';
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message) {
        mensajeError += error.message;
      }
      
      alert(mensajeError);
    }
  };

  const editarTarea = async (id, datosActualizados) => {
    try {
      if (!id || !datosActualizados) {
        console.error('Error: id o datosActualizados no definidos', { id, datosActualizados });
        alert('Error: No se pudo editar la tarea. Por favor, intenta nuevamente.');
        return;
      }

      console.log('Editando tarea:', id, datosActualizados);

      // Obtener la tarea actual para obtener el list_id
      const tareaActual = tareas.find(t => t.id === id);
      if (!tareaActual) {
        console.error('Tarea no encontrada:', id);
        alert('Error: La tarea no se encontró.');
        return;
      }

      // Obtener el ID de la lista actual
      const listaActualId = listsMap[estado];
      if (!listaActualId) {
        console.error('Lista actual no encontrada para estado:', estado);
        alert('Error: No se pudo encontrar la lista actual. Por favor, recarga la página.');
        return;
      }

      // Preparar datos para actualizar en el backend
      // Convertir fecha a formato ISO si existe
      let fechaVencimientoFormateada = null;
      if (datosActualizados.fechaVencimiento) {
        // Si es string, convertirlo a ISO
        if (typeof datosActualizados.fechaVencimiento === 'string') {
          const fecha = new Date(datosActualizados.fechaVencimiento);
          if (!isNaN(fecha.getTime())) {
            fechaVencimientoFormateada = fecha.toISOString();
          }
        } else {
          fechaVencimientoFormateada = datosActualizados.fechaVencimiento;
        }
      } else if (tareaActual.fechaVencimiento) {
        // Mantener la fecha actual si no se cambió
        if (typeof tareaActual.fechaVencimiento === 'string') {
          const fecha = new Date(tareaActual.fechaVencimiento);
          if (!isNaN(fecha.getTime())) {
            fechaVencimientoFormateada = fecha.toISOString();
          }
        } else {
          fechaVencimientoFormateada = tareaActual.fechaVencimiento;
        }
      }
      
      const datosBackend = {
        title: datosActualizados.texto || tareaActual.texto,
        description: datosActualizados.descripcion !== undefined ? datosActualizados.descripcion : (tareaActual.descripcion || ''),
        due_date: fechaVencimientoFormateada,
        list: listaActualId
      };

      // Si se actualizaron las etiquetas, incluirlas
      if (datosActualizados.label_ids !== undefined) {
        datosBackend.label_ids = datosActualizados.label_ids;
      } else if (tareaActual.labels) {
        // Mantener las etiquetas actuales si no se cambiaron
        const labelIds = tareaActual.labels.map(l => typeof l === 'object' ? l.id : l);
        datosBackend.label_ids = labelIds;
      }

      // Manejar la asignación: usar asignadoAId si está disponible, sino mantener el actual
      if (datosActualizados.asignadoAId !== undefined) {
        // Si se proporciona un ID explícito, usarlo
        datosBackend.assigned_to_id = datosActualizados.asignadoAId;
      } else if (datosActualizados.asignadoA === null || datosActualizados.asignadoA === '') {
        // Si se indica explícitamente que no hay asignado, limpiar
        datosBackend.assigned_to_id = null;
      } else if (tareaActual.asignadoAId) {
        // Si no se cambió pero había una asignación, mantenerla
        datosBackend.assigned_to_id = tareaActual.asignadoAId;
      } else {
        // Si no había asignación y no se especifica nueva, dejar null
        datosBackend.assigned_to_id = null;
      }

      // Actualizar en el backend
      console.log('Enviando actualización al backend:', datosBackend);
      const cardActualizada = await cardsAPI.update(id, datosBackend);
      console.log('Tarea actualizada en backend:', cardActualizada);
      
      if (!cardActualizada) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Actualizar el estado local directamente con los datos del backend
      if (cardActualizada) {
        const tareaActualizada = {
          id: cardActualizada.id,
          texto: cardActualizada.title,
          descripcion: cardActualizada.description || '',
          asignadoA: cardActualizada.assigned_to ? (cardActualizada.assigned_to.username || cardActualizada.assigned_to.first_name || '') : null,
          asignadoAId: cardActualizada.assigned_to ? cardActualizada.assigned_to.id : null,
          fechaVencimiento: cardActualizada.due_date || null,
          cursoId: cardActualizada.list?.board?.id || cursoId,
          labels: cardActualizada.labels || [],
          grade: cardActualizada.grade || null
        };

        // Actualizar el estado local preservando la columna actual
        setTareas((prev) => {
          const nuevas = { ...prev };
          
          // Buscar y actualizar la tarea en todas las columnas
          Object.keys(nuevas).forEach(estadoKey => {
            const index = nuevas[estadoKey].findIndex(t => t.id === id);
            if (index !== -1) {
              // Actualizar la tarea existente en su columna actual
              nuevas[estadoKey][index] = tareaActualizada;
            }
          });

          // Verificar si la tarea cambió de columna según el backend
          const listTitle = cardActualizada.list?.title?.toLowerCase() || '';
          let nuevaColumna = null;
          
          if (listTitle.includes('pendiente')) {
            nuevaColumna = 'pendiente';
          } else if (listTitle.includes('progreso') || listTitle.includes('en progreso')) {
            nuevaColumna = 'progreso';
          } else if (listTitle.includes('completada') || listTitle.includes('completado')) {
            nuevaColumna = 'completada';
          }
          
          // Si la columna cambió según el backend, mover la tarea
          if (nuevaColumna && nuevaColumna !== estado) {
            // Remover de todas las columnas
            Object.keys(nuevas).forEach(estadoKey => {
              nuevas[estadoKey] = nuevas[estadoKey].filter(t => t.id !== id);
            });
            // Agregar en la nueva columna
            nuevas[nuevaColumna].push(tareaActualizada);
          }
          
          return nuevas;
        });
        
        // Registrar actividad
        if (onActividad) {
          onActividad('tarea_editada', `Tarea "${cardActualizada.title}" actualizada`, {
            tareaId: cardActualizada.id
          });
        }
      }

      // NO recargar desde el backend para evitar que la tarea se regrese
      // El estado local ya está actualizado con la información correcta
      
      console.log('Tarea editada exitosamente');
      
      // Notificar al componente padre que hubo una actualización (opcional, para sincronización)
      // No recargamos inmediatamente para evitar conflictos, pero el estado ya está actualizado
    } catch (error) {
      console.error('Error al editar tarea:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al editar la tarea. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para editar esta tarea.';
        } else if (status === 404) {
          mensajeError += 'La tarea no fue encontrada.';
        } else if (status === 400) {
          mensajeError += data?.detail || data?.message || 'Datos inválidos.';
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message) {
        mensajeError += error.message;
      }
      
      alert(mensajeError);
    }
  };

  const eliminarTarea = async (id) => {
    try {
      if (!id) {
        console.error('Error: id no definido', { id });
        alert('Error: No se pudo eliminar la tarea. Por favor, intenta nuevamente.');
        return;
      }

      const tarea = tareas.find(t => t.id === id);
      if (!tarea) {
        console.error('Error: tarea no encontrada', { id });
        alert('Error: La tarea no se encontró.');
        return;
      }

      if (window.confirm(`¿Estás seguro de que quieres eliminar la tarea "${tarea.texto}"? Esta acción no se puede deshacer.`)) {
        console.log('Eliminando tarea:', id);
        
        // Eliminar en el backend
        await cardsAPI.delete(id);
        console.log('Tarea eliminada en backend, recargando...');

        // Notificar al componente padre para que recargue las tareas
        if (onTareaMovida) {
          onTareaMovida();
        }
      }
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al eliminar la tarea. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para eliminar esta tarea.';
        } else if (status === 404) {
          mensajeError += 'La tarea no fue encontrada.';
        } else if (status === 500) {
          mensajeError += 'Error interno del servidor. Verifica los logs del backend.';
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message) {
        mensajeError += error.message;
      }
      
      alert(mensajeError);
    }
  };

  const asignarTarea = (id, estudiante) => {
    try {
      if (!id) {
        console.error('Error: id no definido', { id });
        alert('Error: No se pudo asignar la tarea. Por favor, intenta nuevamente.');
        return;
      }

      // Asegurar que estudiante sea siempre un string (nombre)
      const nombreEstudiante = typeof estudiante === 'object' 
        ? (estudiante.nombre || estudiante.username || '')
        : (estudiante || '');

      setTareas((prev) => {
        const nuevas = { ...prev };
        nuevas[estado] = nuevas[estado].map(t => 
          t.id === id ? { ...t, asignadoA: nombreEstudiante } : t
        );
        return nuevas;
      });

      if (onActividad) {
        const tarea = tareas.find(t => t.id === id);
        if (tarea) {
          onActividad('tarea_asignada', `Tarea "${tarea.texto}" asignada a ${nombreEstudiante}`, {
            tareaId: id,
            estudiante: nombreEstudiante
          });
        }
      }
    } catch (error) {
      console.error('Error al asignar tarea:', error);
      alert('Error al asignar la tarea. Por favor, intenta nuevamente.');
    }
  };

  const getColorFondo = () => {
    if (isDark) {
      switch(estado) {
        case 'pendiente': return '#1e3a5f';
        case 'progreso': return '#5a3a1e';
        case 'completada': return '#1e4a2e';
        default: return '#2d2d2d';
      }
    } else {
      switch(estado) {
        case 'pendiente': return '#e3f2fd';
        case 'progreso': return '#fff3e0';
        case 'completada': return '#e8f5e8';
        default: return '#f5f5f5';
      }
    }
  };

  const getColorBorde = () => {
    switch(estado) {
      case 'pendiente': return '#2196f3';
      case 'progreso': return '#ff9800';
      case 'completada': return '#4caf50';
      default: return isDark ? '#555' : '#ddd';
    }
  };

  const tareaIds = tareas.map(t => t.id.toString());

  return (
    <div 
      ref={setNodeRef}
      style={{ 
        background: getColorFondo(), 
        padding: '20px', 
        borderRadius: '15px', 
        width: '100%',
        boxShadow: isDark ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
        border: `2px solid ${getColorBorde()}`,
        minHeight: '400px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        transition: 'background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      }}
    >
      <h2 style={{ 
        margin: '0 0 20px 0', 
        color: getColorBorde(),
        textAlign: 'center',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        {titulo} ({tareas.length})
      </h2>
      
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {usuario.rol === 'docente' ? (
          // Para docentes, no usar SortableContext (drag and drop deshabilitado)
          tareas.length === 0 ? (
            <p style={{ 
              textAlign: 'center', 
              color: isDark ? '#777' : '#999', 
              fontSize: '14px', 
              padding: '20px',
              fontStyle: 'italic'
            }}>
              No hay tareas en esta columna
            </p>
          ) : (
            tareas.map((tarea) => (
              <TareaIndividual
                key={tarea.id}
                tarea={tarea}
                onEditar={editarTarea}
                onEliminar={eliminarTarea}
                onMover={moverTarea}
                onAsignar={asignarTarea}
                estado={estado}
                usuario={usuario}
                etiquetas={etiquetas}
                onTareaActualizada={onTareaMovida}
                boardId={cursoId}
              />
            ))
          )
        ) : (
          // Para estudiantes, usar SortableContext (drag and drop habilitado)
          <SortableContext items={tareaIds} strategy={verticalListSortingStrategy}>
            {tareas.length === 0 ? (
              <p style={{ 
                textAlign: 'center', 
                color: isDark ? '#777' : '#999', 
                fontSize: '14px', 
                padding: '20px',
                fontStyle: 'italic'
              }}>
                No hay tareas en esta columna
              </p>
            ) : (
              tareas.map((tarea) => (
                <TareaIndividual
                  key={tarea.id}
                  tarea={tarea}
                  onEditar={editarTarea}
                  onEliminar={eliminarTarea}
                  onMover={moverTarea}
                  onAsignar={asignarTarea}
                  estado={estado}
                  usuario={usuario}
                  etiquetas={etiquetas}
                  onTareaActualizada={onTareaMovida}
                  boardId={cursoId}
                />
              ))
            )}
          </SortableContext>
        )}
      </div>
    </div>
  );
}

export default Columna;
