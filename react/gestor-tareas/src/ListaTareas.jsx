import { useState, useEffect } from 'react';
import Tarea from './Tarea';

function ListaTareas() {
  const [tareas, setTareas] = useState([]);
  const [nuevaTarea, setNuevaTarea] = useState('');

  // Cargar tareas del localStorage al iniciar
  useEffect(() => {
    const tareasGuardadas = localStorage.getItem('tareas');
    if (tareasGuardadas) {
      setTareas(JSON.parse(tareasGuardadas));
    }
  }, []);

  // Guardar tareas en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('tareas', JSON.stringify(tareas));
  }, [tareas]);

  const agregarTarea = () => {
    if (nuevaTarea.trim() !== '') {
      const nuevaTareaObj = {
        id: Date.now(),
        texto: nuevaTarea,
        completada: false
      };
      setTareas([...tareas, nuevaTareaObj]);
      setNuevaTarea('');
    }
  };

  const eliminarTarea = (id) => {
    setTareas(tareas.filter(tarea => tarea.id !== id));
  };

  const toggleCompletada = (id) => {
    setTareas(tareas.map(tarea => 
      tarea.id === id ? { ...tarea, completada: !tarea.completada } : tarea
    ));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px' }}>
      <h2>Gestor de Tareas 📝</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Escribe una tarea"
          value={nuevaTarea}
          onChange={(e) => setNuevaTarea(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && agregarTarea()}
          style={{ padding: '8px', marginRight: '8px', width: '300px' }}
        />
        <button onClick={agregarTarea} style={{ padding: '8px 16px' }}>
          Agregar
        </button>
      </div>

      {tareas.length === 0 ? (
        <p>No tienes tareas pendientes</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {tareas.map((tarea) => (
            <Tarea
              key={tarea.id}
              texto={tarea.texto}
              completada={tarea.completada}
              eliminarTarea={() => eliminarTarea(tarea.id)}
              toggleCompletada={() => toggleCompletada(tarea.id)}
            />
          ))}
        </ul>
      )}

      <div style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Total: {tareas.length} | Completadas: {tareas.filter(t => t.completada).length}
      </div>
    </div>
  );
}

export default ListaTareas;

