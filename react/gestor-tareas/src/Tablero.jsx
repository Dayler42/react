import { useState, useEffect, useCallback, useRef } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import Columna from './Columna.jsx';
import NuevaTarea from './NuevaTarea.jsx';
import GestionCursos from './GestionCursos.jsx';
import FiltrosEstudiante from './FiltrosEstudiante.jsx';
import HistorialActividad from './HistorialActividad.jsx';
import Calificaciones from './Calificaciones.jsx';
import { useTheme } from './ThemeContext.jsx';
import { cardsAPI, listsAPI, boardsAPI, labelsAPI } from './api';

function Tablero({ usuario }) {
  const { isDark } = useTheme();
  const [tareas, setTareas] = useState({
    pendiente: [],
    progreso: [],
    completada: []
  });

  const [cursos, setCursos] = useState([]);
  const [cursoActual, setCursoActual] = useState(null);
  const [estudiantes, setEstudiantes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarCalificaciones, setMostrarCalificaciones] = useState(false);
  const [filtro, setFiltro] = useState('todas'); // 'todas', 'mis-asignaciones', 'proximas-vencer'
  const [etiquetas, setEtiquetas] = useState([]);

  const [todasLasTareas, setTodasLasTareas] = useState({}); // Todas las tareas de todos los cursos
  const [boardId, setBoardId] = useState(null); // ID del board actual
  const [listsMap, setListsMap] = useState({}); // Mapa de estados a list IDs: {pendiente: id, progreso: id, completada: id}
  const [activeId, setActiveId] = useState(null); // ID del elemento que se está arrastrando

  // Cargar boards (cursos) desde el backend
  useEffect(() => {
    const cargarBoards = async () => {
      try {
        const boards = await boardsAPI.getAll();
        
        // boardsAPI.getAll ya maneja la paginación y devuelve un array
        if (!Array.isArray(boards)) {
          console.error('Error: boards no es un array:', boards);
          setCursos([]);
          return;
        }
        
        const boardsFormateados = boards.map(board => ({
          id: board.id,
          nombre: board.name,
          docente: board.teacher?.username || usuario.nombre
        }));
        
        setCursos(boardsFormateados);
        
        // Si hay boards y no hay curso actual
        if (boardsFormateados.length > 0 && !cursoActual) {
          // Intentar cargar curso guardado en localStorage
          const cursoGuardado = localStorage.getItem('cursoActual');
          if (cursoGuardado) {
            try {
              const curso = JSON.parse(cursoGuardado);
              // Verificar que el curso aún existe en los boards
              const cursoExistente = boardsFormateados.find(b => b.id === curso.id);
              if (cursoExistente) {
                setCursoActual(cursoExistente);
                return;
              }
            } catch (e) {
              console.error('Error al cargar curso guardado:', e);
            }
          }
          
          // Si no hay curso guardado o no existe, seleccionar el primero
          setCursoActual(boardsFormateados[0]);
        }
      } catch (error) {
        console.error('Error al cargar boards:', error);
        // Si no hay boards, inicializar con array vacío
        setCursos([]);
      }
    };
    
    cargarBoards();
  }, [usuario.rol]);
  
  // Función para cargar tareas desde el backend
  const cargarTareasDesdeBackend = useCallback(async () => {
    if (!cursoActual) return;
    
    try {
      console.log('Cargando tareas desde backend para curso:', cursoActual.id);
      // Obtener todas las cards del board actual
      const cards = await cardsAPI.getAll({ board: cursoActual.id });
      console.log('Cards recibidas:', cards);
      
      // Organizar las tareas por estado
          const tareasMapeadas = {
            pendiente: [],
            progreso: [],
            completada: []
          };
          
          cards.forEach(card => {
            const tarea = {
              id: card.id,
              texto: card.title,
              descripcion: card.description || '',
              asignadoA: card.assigned_to ? (card.assigned_to.username || card.assigned_to.first_name || '') : null,
              asignadoAId: card.assigned_to ? card.assigned_to.id : null,
              fechaVencimiento: card.due_date || null,
              cursoId: card.list?.board?.id || cursoActual.id,
              labels: card.labels || [],
              grade: card.grade || null
            };
            
        // Organizar según el título de la lista
            const listTitle = card.list?.title?.toLowerCase() || '';
        console.log('Procesando card:', card.title, 'Lista:', listTitle);
        
            if (listTitle.includes('pendiente')) {
              tareasMapeadas.pendiente.push(tarea);
            } else if (listTitle.includes('progreso') || listTitle.includes('en progreso')) {
              tareasMapeadas.progreso.push(tarea);
            } else if (listTitle.includes('completada') || listTitle.includes('completado')) {
              tareasMapeadas.completada.push(tarea);
            } else {
              // Por defecto, agregar a pendiente
              tareasMapeadas.pendiente.push(tarea);
            }
          });
          
      console.log('Tareas mapeadas:', tareasMapeadas);
          setTareas(tareasMapeadas);
        } catch (error) {
      console.error('Error al cargar tareas:', error);
      console.error('Error completo:', error.response);
          // Si hay error, mantener el estado vacío
          setTareas({ pendiente: [], progreso: [], completada: [] });
        }
  }, [cursoActual?.id]);

  // Ref para mantener referencia estable a la función de cargar tareas
  const cargarTareasRef = useRef(cargarTareasDesdeBackend);
  
  // Actualizar la ref cuando cambia la función
  useEffect(() => {
    cargarTareasRef.current = cargarTareasDesdeBackend;
  }, [cargarTareasDesdeBackend]);

  // Función para cargar estudiantes del curso actual desde el backend
  const cargarEstudiantesDelCurso = useCallback(async () => {
    try {
      if (!cursoActual?.id) {
        setEstudiantes([]);
        return;
      }

      console.log('Cargando estudiantes del curso:', cursoActual.id);
      
      // Obtener el board completo con sus estudiantes
      const board = await boardsAPI.getById(cursoActual.id);
      console.log('Board recibido:', board);
      
      // Verificar que board existe y tiene estudiantes
      if (!board) {
        console.log('Board no encontrado');
        setEstudiantes([]);
        return;
      }

      if (board.students && Array.isArray(board.students)) {
        // Mapear los estudiantes del board al formato esperado
        const estudiantesMapeados = board.students.map(student => {
          if (!student || !student.id) {
            console.warn('Estudiante inválido encontrado:', student);
            return null;
          }
          
          const nombre = student.username || 
                        (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : student.first_name) || 
                        'Estudiante';
          
          return {
            id: student.id,
            nombre: nombre,
            userId: student.id,
            cursoId: cursoActual.id,
            email: student.email || '',
            first_name: student.first_name || '',
            last_name: student.last_name || ''
          };
        }).filter(est => est !== null); // Filtrar estudiantes inválidos
        
        console.log('Estudiantes mapeados:', estudiantesMapeados);
        console.log('Cantidad de estudiantes:', estudiantesMapeados.length);
        setEstudiantes(estudiantesMapeados);
        console.log('Estado de estudiantes actualizado');
      } else {
        console.log('No se encontraron estudiantes en el board o board.students no es un array');
        setEstudiantes([]);
      }
    } catch (error) {
      console.error('Error al cargar estudiantes del curso:', error);
      console.error('Error response:', error.response);
      console.error('Error stack:', error.stack);
      // Si hay error, mantener el estado vacío en lugar de fallar
      setEstudiantes([]);
    }
  }, [cursoActual?.id]);
      
  // Obtiene y organiza las tareas desde la API
  useEffect(() => {
    if (cursoActual) {
      cargarTareasDesdeBackend();
    }
  }, [cursoActual?.id, usuario.rol, cargarTareasDesdeBackend]);

  // Recargar tareas periódicamente para docentes (para ver cambios de estudiantes)
  useEffect(() => {
    if (!cursoActual || usuario.rol !== 'docente') {
      console.log('No se iniciará recarga automática:', { cursoActual: !!cursoActual, rol: usuario.rol });
      return;
    }

    console.log('Iniciando recarga automática de tareas para docente...');
    
    // Recargar cada 10 segundos para mantener sincronizado sin sobrecargar
    const intervalo = setInterval(() => {
      console.log('Recargando tareas automáticamente (docente)...', new Date().toLocaleTimeString());
      // Usar la ref para evitar problemas con dependencias
      if (cargarTareasRef.current) {
        cargarTareasRef.current();
      }
    }, 10000); // 10 segundos

    // Limpiar intervalo al desmontar o cambiar de curso
    return () => {
      console.log('Limpiando intervalo de recarga automática');
      clearInterval(intervalo);
    };
  }, [cursoActual?.id, usuario.rol]);

  // Recargar tareas cuando la ventana recupera el foco (para docentes)
  useEffect(() => {
    if (usuario.rol !== 'docente') return;

    const handleFocus = () => {
      if (cursoActual && cargarTareasRef.current) {
        console.log('Ventana recuperó el foco, recargando tareas...');
        cargarTareasRef.current();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [cursoActual?.id, usuario.rol]);

  // Cargar estudiantes cuando cambia el curso actual
  useEffect(() => {
    if (cursoActual) {
      cargarEstudiantesDelCurso();
    }
  }, [cursoActual?.id, cargarEstudiantesDelCurso]);

  // Cargar etiquetas del board actual y crear predefinidas si no existen
  useEffect(() => {
    const cargarEtiquetas = async () => {
      if (!cursoActual?.id) {
        setEtiquetas([]);
        return;
      }

      try {
        const labels = await labelsAPI.getAll(cursoActual.id);
        const etiquetasExistentes = Array.isArray(labels) ? labels : [];
        
        // Etiquetas predefinidas
        const ETIQUETAS_PREDEFINIDAS = [
          { name: 'Examen', color: '#d32f2f' },
          { name: 'Entrega Obligatoria', color: '#f44336' },
          { name: 'Importante', color: '#ff9800' },
          { name: 'Proyecto', color: '#9c27b0' },
          { name: 'Práctica', color: '#2196f3' },
          { name: 'Lectura', color: '#4caf50' }
        ];

        // Verificar y crear etiquetas predefinidas que no existan
        const nombresExistentes = etiquetasExistentes.map(e => e.name.toLowerCase());
        const etiquetasACrear = ETIQUETAS_PREDEFINIDAS.filter(
          predef => !nombresExistentes.includes(predef.name.toLowerCase())
        );

        if (etiquetasACrear.length > 0) {
          try {
            const nuevasEtiquetas = await Promise.all(
              etiquetasACrear.map(predef =>
                labelsAPI.create({
                  board: cursoActual.id,
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
      }
    };

    cargarEtiquetas();
  }, [cursoActual?.id]);

  // Si es estudiante y no hay curso seleccionado pero hay cursos, seleccionar el primero
  useEffect(() => {
    if (usuario.rol === 'estudiante' && !cursoActual && cursos.length > 0) {
      setCursoActual(cursos[0]);
    }
  }, [cursos, cursoActual, usuario.rol]);

  // Cargar listas cuando cambie el curso actual
  useEffect(() => {
    if (cursoActual) {
      setBoardId(cursoActual.id);
      
      // Cargar listas del board
      const cargarListas = async () => {
        try {
          console.log('Cargando listas para el curso:', cursoActual.id);
          const lists = await listsAPI.getAll(cursoActual.id);
          console.log('Listas recibidas:', lists);
          
          const newListsMap = {};
          lists.forEach(list => {
            const titleLower = list.title.toLowerCase();
            console.log('Procesando lista:', list.title, 'ID:', list.id);
            
            if (titleLower.includes('pendiente')) {
              newListsMap.pendiente = list.id;
              console.log('Mapeado pendiente:', list.id);
            } else if (titleLower.includes('progreso') || titleLower.includes('en progreso')) {
              newListsMap.progreso = list.id;
              console.log('Mapeado progreso:', list.id);
            } else if (titleLower.includes('completada') || titleLower.includes('completado')) {
              newListsMap.completada = list.id;
              console.log('Mapeado completada:', list.id);
            }
          });
          
          console.log('ListsMap final:', newListsMap);
          setListsMap(newListsMap);
          
          // Verificar que todas las listas estén mapeadas
          if (!newListsMap.pendiente || !newListsMap.progreso || !newListsMap.completada) {
            console.warn('Advertencia: No todas las listas están mapeadas. Pendiente:', !!newListsMap.pendiente, 'Progreso:', !!newListsMap.progreso, 'Completada:', !!newListsMap.completada);
          }
        } catch (error) {
          console.error('Error al cargar listas:', error);
          console.error('Error completo:', error.response);
          setListsMap({});
          alert('Error al cargar las listas del curso. Por favor, recarga la página.');
        }
      };
      
      cargarListas();
      } else {
      // Si no hay curso, limpiar el mapa de listas
      setListsMap({});
    }
  }, [cursoActual]);

  // Guardar solo el curso actual en localStorage (el resto se carga del backend)
  useEffect(() => {
    if (cursoActual) {
      localStorage.setItem('cursoActual', JSON.stringify(cursoActual));
    }
  }, [cursoActual]);

  const agregarActividad = (tipo, descripcion, detalles = {}) => {
    const nuevaActividad = {
      id: Date.now(),
      fecha: new Date().toISOString(),
      tipo,
      descripcion,
      usuario: usuario.nombre,
      ...detalles
    };
    setHistorial(prev => [nuevaActividad, ...prev].slice(0, 100)); // Mantener solo las últimas 100
  };

  const editarCurso = async (cursoId, nuevoNombre) => {
    try {
      if (!nuevoNombre || !nuevoNombre.trim()) {
        alert('Por favor, ingresa un nombre válido para el curso.');
        return;
      }
      
      console.log('Intentando editar curso:', cursoId, nuevoNombre);
      
      // Actualizar board en el backend
      await boardsAPI.update(cursoId, { 
        name: nuevoNombre.trim()
      });
      
      console.log('Curso editado exitosamente');
      
      // Recargar todos los boards para actualizar la lista
      const boards = await boardsAPI.getAll();
      
      if (!Array.isArray(boards)) {
        console.error('Error: boards no es un array:', boards);
        throw new Error('Formato de respuesta inesperado del servidor');
      }
      
      const boardsFormateados = boards.map(b => ({
        id: b.id,
        nombre: b.name,
        docente: b.teacher?.username || usuario.nombre
      }));
      setCursos(boardsFormateados);
      
      // Actualizar el curso actual si es el que se editó
      if (cursoActual?.id === cursoId) {
        const cursoActualizado = boardsFormateados.find(c => c.id === cursoId);
        if (cursoActualizado) {
          setCursoActual(cursoActualizado);
        }
      }
      
      agregarActividad('curso_editado', `Curso editado a "${nuevoNombre.trim()}"`, { cursoId });
    } catch (error) {
      console.error('Error completo al editar curso:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al editar el curso. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para editar cursos.';
        } else if (status === 404) {
          mensajeError += 'El curso no fue encontrado.';
        } else if (status === 400) {
          if (typeof data === 'object' && data !== null) {
            const errores = Object.keys(data).map(key => {
              const valor = data[key];
              if (Array.isArray(valor)) {
                return `${key}: ${valor.join(', ')}`;
              }
              return `${key}: ${valor}`;
            }).join('\n');
            mensajeError += `\nErrores de validación:\n${errores}`;
          } else {
            mensajeError += data?.detail || data?.message || 'Datos inválidos.';
          }
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message) {
        mensajeError += error.message;
      } else {
        mensajeError += 'Error desconocido. Revisa la consola para más detalles.';
      }
      
      alert(mensajeError);
    }
  };

  const eliminarCurso = async (cursoId) => {
    try {
      console.log('Intentando eliminar curso:', cursoId);
      
      // Eliminar board en el backend
      await boardsAPI.delete(cursoId);
      
      console.log('Curso eliminado exitosamente');
      
      // Recargar todos los boards para actualizar la lista
      const boards = await boardsAPI.getAll();
      
      if (!Array.isArray(boards)) {
        console.error('Error: boards no es un array:', boards);
        setCursos([]);
        return;
      }
      
      const boardsFormateados = boards.map(b => ({
        id: b.id,
        nombre: b.name,
        docente: b.teacher?.username || usuario.nombre
      }));
      setCursos(boardsFormateados);
      
      // Si el curso eliminado era el actual, seleccionar otro o limpiar
      if (cursoActual?.id === cursoId) {
        if (boardsFormateados.length > 0) {
          setCursoActual(boardsFormateados[0]);
        } else {
          setCursoActual(null);
        }
      }
      
      agregarActividad('curso_eliminado', `Curso eliminado`, { cursoId });
    } catch (error) {
      console.error('Error completo al eliminar curso:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al eliminar el curso. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para eliminar cursos.';
        } else if (status === 404) {
          mensajeError += 'El curso no fue encontrado.';
        } else if (status === 500) {
          mensajeError += 'Error interno del servidor. Verifica los logs del backend.';
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo.';
      } else if (error.message) {
        mensajeError += error.message;
      } else {
        mensajeError += 'Error desconocido. Revisa la consola para más detalles.';
      }
      
      alert(mensajeError);
    }
  };

  const crearCurso = async (nombreCurso) => {
    try {
      if (!nombreCurso || !nombreCurso.trim()) {
        alert('Por favor, ingresa un nombre válido para el curso.');
        return;
      }
      
      console.log('Intentando crear curso:', nombreCurso);
      
      // Crear board en el backend
      const board = await boardsAPI.create({ 
        name: nombreCurso.trim(), 
        description: '' 
      });
      
      console.log('Curso creado exitosamente:', board);
      
      // Recargar todos los boards para actualizar la lista
      const boards = await boardsAPI.getAll();
      
      // boardsAPI.getAll ya maneja la paginación y devuelve un array
      if (!Array.isArray(boards)) {
        console.error('Error: boards no es un array:', boards);
        throw new Error('Formato de respuesta inesperado del servidor');
      }
      
      const boardsFormateados = boards.map(b => ({
        id: b.id,
        nombre: b.name,
        docente: b.teacher?.username || usuario.nombre
      }));
      setCursos(boardsFormateados);
      
      // Seleccionar el nuevo curso
    const nuevoCurso = {
        id: board.id,
        nombre: nombreCurso.trim(),
      docente: usuario.nombre
    };
    setCursoActual(nuevoCurso);
      setBoardId(board.id);
      
      // Las listas y tareas se cargarán automáticamente por el useEffect
      agregarActividad('curso_creado', `Curso "${nombreCurso}" creado`, { cursoId: board.id });
    } catch (error) {
      console.error('Error completo al crear curso:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let mensajeError = 'Error al crear el curso. ';
      
      if (error.response) {
        // Error del servidor
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para crear cursos. Verifica que estés autenticado correctamente.';
        } else if (status === 400) {
          // Error de validación
          if (typeof data === 'object' && data !== null) {
            const errores = Object.keys(data).map(key => {
              const valor = data[key];
              if (Array.isArray(valor)) {
                return `${key}: ${valor.join(', ')}`;
              }
              return `${key}: ${valor}`;
            }).join('\n');
            mensajeError += `\nErrores de validación:\n${errores}`;
          } else {
            mensajeError += data?.detail || data?.message || 'Datos inválidos.';
          }
        } else if (status === 500) {
          mensajeError += 'Error interno del servidor. Verifica los logs del backend.';
        } else {
          mensajeError += `Error del servidor (${status}).`;
        }
      } else if (error.isNetworkError || error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_REFUSED') {
        mensajeError += 'No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8000';
      } else if (error.message) {
        mensajeError += error.message;
      } else {
        mensajeError += 'Error desconocido. Revisa la consola para más detalles.';
      }
      
      alert(mensajeError);
    }
  };

  const agregarEstudiante = async (estudianteData) => {
    if (!cursoActual?.id) {
      alert('Error: No hay curso seleccionado');
      return;
    }

    try {
      // Extraer el userId del estudiante
      let userId;
      let nombreEstudiante;
      
      if (typeof estudianteData === 'string') {
        // Si es string (compatibilidad con código antiguo)
        nombreEstudiante = estudianteData;
        alert('Error: Necesitas seleccionar un estudiante de la lista');
        return;
      } else if (typeof estudianteData === 'object' && estudianteData !== null) {
        userId = estudianteData.userId || estudianteData.id;
        nombreEstudiante = estudianteData.nombre || estudianteData.username || 'Estudiante';
      } else {
        console.error('Error: agregarEstudiante recibió un tipo inválido:', typeof estudianteData);
        alert('Error: Datos inválidos del estudiante');
        return;
      }

      if (!userId) {
        alert('Error: No se pudo obtener el ID del estudiante');
        return;
      }

      console.log('Agregando estudiante al curso:', cursoActual.id, 'Estudiante ID:', userId);
      console.log('Estudiantes antes de agregar:', estudiantes);
      
      // Agregar estudiante al board en el backend
      const boardActualizado = await boardsAPI.addStudent(cursoActual.id, userId);
      
      console.log('Estudiante agregado exitosamente al backend');
      console.log('Board actualizado recibido:', boardActualizado);
      
      // Verificar que el board actualizado tenga los estudiantes
      if (boardActualizado && boardActualizado.students) {
        console.log('Estudiantes en board actualizado:', boardActualizado.students);
      }
      
      // Recargar el board para obtener los estudiantes actualizados
      // Esperar un momento para asegurar que el backend haya actualizado
      await new Promise(resolve => setTimeout(resolve, 200));
      await cargarEstudiantesDelCurso();
      
      // Verificar que los estudiantes se hayan cargado
      console.log('Verificando estudiantes después de recargar...');
      
      agregarActividad('estudiante_agregado', `Estudiante "${nombreEstudiante}" agregado`, { estudianteId: userId });
    } catch (error) {
      console.error('Error al agregar estudiante:', error);
      console.error('Error response:', error.response);
      
      let mensajeError = 'Error al agregar el estudiante al curso. ';
      
      if (error.response) {
        const status = error.response.status;
        const data = error.response.data;
        
        if (status === 401 || status === 403) {
          mensajeError += 'No tienes permiso para agregar estudiantes a este curso.';
        } else if (status === 404) {
          mensajeError += 'El estudiante o el curso no fueron encontrados.';
        } else if (status === 400) {
          mensajeError += data?.error || data?.detail || data?.message || 'Datos inválidos.';
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

  const actualizarTareas = (nuevasTareas) => {
    try {
      // Validar que nuevasTareas sea un objeto válido
      if (!nuevasTareas || typeof nuevasTareas !== 'object' || Array.isArray(nuevasTareas)) {
        console.error('Error: nuevasTareas no es un objeto válido', nuevasTareas);
        return;
      }
      
      // Validar que tenga la estructura correcta con las tres columnas
      const estructuraEsperada = ['pendiente', 'progreso', 'completada'];
      const tieneEstructuraCorrecta = estructuraEsperada.every(
        key => key in nuevasTareas && Array.isArray(nuevasTareas[key])
      );
      
      if (!tieneEstructuraCorrecta) {
        console.error('Error: nuevasTareas no tiene la estructura correcta. Esperado:', estructuraEsperada, 'Recibido:', Object.keys(nuevasTareas));
        // Si falta alguna clave, inicializarla con array vacío
        const tareasValidadas = {
          pendiente: Array.isArray(nuevasTareas.pendiente) ? nuevasTareas.pendiente : [],
          progreso: Array.isArray(nuevasTareas.progreso) ? nuevasTareas.progreso : [],
          completada: Array.isArray(nuevasTareas.completada) ? nuevasTareas.completada : []
        };
        setTareas(tareasValidadas);
        return;
      }
      
      setTareas(nuevasTareas);
    } catch (error) {
      console.error('Error al actualizar tareas:', error);
      alert('Error al actualizar las tareas. Por favor, recarga la página.');
    }
  };

  // Filtrar tareas según el filtro seleccionado (para estudiantes)
  const obtenerTareasFiltradas = () => {
    if (usuario.rol === 'docente' || filtro === 'todas') {
      return tareas;
    }

    const ahora = new Date();
    const tareasFiltradas = { pendiente: [], progreso: [], completada: [] };

    Object.keys(tareas).forEach(estado => {
      tareasFiltradas[estado] = tareas[estado].filter(tarea => {
        if (filtro === 'mis-asignaciones') {
          // Normalizar asignadoA para comparar correctamente
          const asignadoA = typeof tarea.asignadoA === 'object' 
            ? (tarea.asignadoA?.nombre || tarea.asignadoA?.username || '')
            : (tarea.asignadoA || '');
          return asignadoA === (usuario?.nombre || '');
        }
        if (filtro === 'proximas-vencer') {
          if (!tarea.fechaVencimiento) return false;
          const fechaVenc = new Date(tarea.fechaVencimiento);
          const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));
          return diasRestantes <= 7 && diasRestantes >= 0; // Próximas 7 días
        }
        return true;
      });
    });

    return tareasFiltradas;
  };

  const tareasFiltradas = obtenerTareasFiltradas();

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const handleDragEnd = async (event) => {
    const { active } = event;
    setActiveId(null);
    
    // Función para validar la estructura del estado
    const validarEstructuraEstado = (estado) => {
      if (!estado || typeof estado !== 'object' || Array.isArray(estado)) {
        return false;
      }
      const clavesEsperadas = ['pendiente', 'progreso', 'completada'];
      return clavesEsperadas.every(key => key in estado && Array.isArray(estado[key]));
    };
    
    try {
      const { active, over } = event;
      
      if (!over || active.id === over.id) return;

      // Encontrar la tarea que se está arrastrando
      let tarea = null;
      let estadoOrigen = null;
      
      Object.keys(tareas).forEach(estado => {
        const encontrada = tareas[estado].find(t => t.id.toString() === active.id);
        if (encontrada) {
          tarea = encontrada;
          estadoOrigen = estado;
        }
      });

      if (!tarea) {
        console.warn('Tarea no encontrada para mover:', active.id);
        return;
      }

      // Determinar el estado destino
      let estadoDestino = null;
      
      // Si over.id es directamente un estado válido, usarlo
      if (['pendiente', 'progreso', 'completada'].includes(over.id)) {
        estadoDestino = over.id;
      } else {
        // Si over.id es el ID de una tarea, encontrar en qué columna está esa tarea
        Object.keys(tareas).forEach(estado => {
          const tareaDestino = tareas[estado].find(t => t.id.toString() === over.id);
          if (tareaDestino) {
            estadoDestino = estado;
          }
        });
      }

      // Validar que encontramos un estado destino válido
      if (!estadoDestino || !['pendiente', 'progreso', 'completada'].includes(estadoDestino)) {
        console.error('Estado destino inválido o no encontrado. over.id:', over.id);
        return;
      }

      // Si el destino es el mismo que el origen, no hacer nada
      if (estadoDestino === estadoOrigen) {
        console.log('La tarea ya está en la columna de destino');
        return;
      }

      // Obtener el ID de la lista destino
      const listaDestinoId = listsMap[estadoDestino];
      if (!listaDestinoId) {
        console.error('Lista destino no encontrada para el estado:', estadoDestino, 'listsMap:', listsMap);
        alert('Error: No se pudo encontrar la lista de destino. Por favor, recarga la página.');
        return;
      }

      // Actualizar el estado local inmediatamente para mejor UX
      setTareas((prev) => {
        // Validar estructura antes de actualizar
        if (!validarEstructuraEstado(prev)) {
          console.error('Error: Estado no tiene estructura válida antes de actualizar:', prev);
          // Retornar estado válido por defecto
          return {
            pendiente: Array.isArray(prev?.pendiente) ? prev.pendiente : [],
            progreso: Array.isArray(prev?.progreso) ? prev.progreso : [],
            completada: Array.isArray(prev?.completada) ? prev.completada : []
          };
        }
        
        const nuevas = { ...prev };
        // Asegurar que las claves existan y sean arrays
        nuevas.pendiente = Array.isArray(nuevas.pendiente) ? nuevas.pendiente : [];
        nuevas.progreso = Array.isArray(nuevas.progreso) ? nuevas.progreso : [];
        nuevas.completada = Array.isArray(nuevas.completada) ? nuevas.completada : [];
        
        // Remover de estado origen
        nuevas[estadoOrigen] = nuevas[estadoOrigen].filter((t) => t.id !== tarea.id);
        // Agregar al destino
        nuevas[estadoDestino] = [...nuevas[estadoDestino], tarea];
        return nuevas;
      });

      // Actualizar en el backend
      try {
        console.log('Moviendo tarea:', tarea.id, 'de', estadoOrigen, 'a', estadoDestino);
        console.log('Lista destino ID:', listaDestinoId);
        const cardActualizada = await cardsAPI.update(tarea.id, {
          list: listaDestinoId
        });
        
        console.log('Tarea actualizada en backend:', cardActualizada);
        
        // Actualizar el estado local con la tarea actualizada del backend para asegurar sincronización
        if (cardActualizada) {
          const tareaActualizada = {
            id: cardActualizada.id,
            texto: cardActualizada.title,
            descripcion: cardActualizada.description || '',
            asignadoA: cardActualizada.assigned_to ? (cardActualizada.assigned_to.username || cardActualizada.assigned_to.first_name || '') : null,
            asignadoAId: cardActualizada.assigned_to ? cardActualizada.assigned_to.id : null,
            fechaVencimiento: cardActualizada.due_date || null,
            cursoId: cardActualizada.list?.board?.id || cursoActual.id,
            grade: cardActualizada.grade || null
          };

          // Actualizar el estado local con la tarea actualizada
          setTareas((prev) => {
            // Validar estructura antes de actualizar
            if (!validarEstructuraEstado(prev)) {
              console.error('Error: Estado no tiene estructura válida al actualizar desde backend:', prev);
              // Retornar estado válido con la tarea en el destino correcto
              const estadoValido = {
                pendiente: [],
                progreso: [],
                completada: []
              };
              const listTitle = cardActualizada.list?.title?.toLowerCase() || '';
              if (listTitle.includes('pendiente')) {
                estadoValido.pendiente = [tareaActualizada];
              } else if (listTitle.includes('progreso') || listTitle.includes('en progreso')) {
                estadoValido.progreso = [tareaActualizada];
              } else if (listTitle.includes('completada') || listTitle.includes('completado')) {
                estadoValido.completada = [tareaActualizada];
              } else {
                estadoValido[estadoDestino] = [tareaActualizada];
              }
              return estadoValido;
            }
            
            const nuevas = { ...prev };
            // Asegurar que las claves existan y sean arrays
            nuevas.pendiente = Array.isArray(nuevas.pendiente) ? nuevas.pendiente : [];
            nuevas.progreso = Array.isArray(nuevas.progreso) ? nuevas.progreso : [];
            nuevas.completada = Array.isArray(nuevas.completada) ? nuevas.completada : [];
            
            // Asegurar que la tarea no esté en ningún lado primero
            nuevas.pendiente = nuevas.pendiente.filter((t) => t.id !== tareaActualizada.id);
            nuevas.progreso = nuevas.progreso.filter((t) => t.id !== tareaActualizada.id);
            nuevas.completada = nuevas.completada.filter((t) => t.id !== tareaActualizada.id);
            
            // Agregar en el destino correcto según el título de la lista
            const listTitle = cardActualizada.list?.title?.toLowerCase() || '';
            if (listTitle.includes('pendiente')) {
              nuevas.pendiente.push(tareaActualizada);
            } else if (listTitle.includes('progreso') || listTitle.includes('en progreso')) {
              nuevas.progreso.push(tareaActualizada);
            } else if (listTitle.includes('completada') || listTitle.includes('completado')) {
              nuevas.completada.push(tareaActualizada);
            } else {
              // Por defecto, agregar al destino que el usuario seleccionó
              nuevas[estadoDestino].push(tareaActualizada);
            }
            
            return nuevas;
          });
        }
        
        // NO recargar desde el backend para evitar que la tarea se regrese
        // El estado local ya está actualizado con la información correcta del backend
      } catch (error) {
        console.error('Error al actualizar tarea en el backend:', error);
        console.error('Error completo:', error.response);
        
        let mensajeError = 'Error al guardar el movimiento de la tarea. ';
        
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
        
        // Revertir el cambio local si falló en el backend
        setTareas((prev) => {
          // Validar estructura antes de revertir
          if (!validarEstructuraEstado(prev)) {
            console.error('Error: Estado no tiene estructura válida al revertir:', prev);
            // Retornar estado válido con la tarea en el origen
            const estadoValido = {
              pendiente: [],
              progreso: [],
              completada: []
            };
            estadoValido[estadoOrigen] = [tarea];
            return estadoValido;
          }
          
          const nuevas = { ...prev };
          // Asegurar que las claves existan y sean arrays
          nuevas.pendiente = Array.isArray(nuevas.pendiente) ? nuevas.pendiente : [];
          nuevas.progreso = Array.isArray(nuevas.progreso) ? nuevas.progreso : [];
          nuevas.completada = Array.isArray(nuevas.completada) ? nuevas.completada : [];
          
          // Remover del destino
          nuevas[estadoDestino] = nuevas[estadoDestino].filter((t) => t.id !== tarea.id);
          // Volver a agregar al origen
          nuevas[estadoOrigen] = [...nuevas[estadoOrigen], tarea];
          return nuevas;
        });
        
        return;
      }

      // Registrar actividad
      const nombresEstados = {
        'pendiente': 'Pendiente',
        'progreso': 'En Progreso',
        'completada': 'Completada'
      };
      agregarActividad('tarea_movida', `Tarea "${tarea.texto}" movida de ${nombresEstados[estadoOrigen]} a ${nombresEstados[estadoDestino]}`, {
        tareaId: tarea.id,
        estadoAnterior: estadoOrigen,
        estadoNuevo: estadoDestino
      });
    } catch (error) {
      console.error('Error al mover tarea (drag and drop):', error);
      alert('Error al mover la tarea. Por favor, intenta nuevamente.');
    }
  };

  // Si no hay curso seleccionado
  if (!cursoActual) {
    // Si es docente, mostrar gestión de cursos
    if (usuario.rol === 'docente') {
      return (
        <div style={{ 
          background: isDark ? '#1a1a1a' : '#f8f9fa',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          color: isDark ? '#fff' : '#333',
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
          <GestionCursos 
            cursos={cursos}
            onCreateCurso={crearCurso}
            onEditarCurso={editarCurso}
            onEliminarCurso={eliminarCurso}
            onSelectCurso={setCursoActual}
          />
        </div>
      );
    }
    // Si es estudiante y no hay cursos
    if (usuario.rol === 'estudiante') {
      return (
        <div style={{ 
          background: isDark ? '#1a1a1a' : '#f8f9fa',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'Arial, sans-serif',
          textAlign: 'center',
          color: isDark ? '#fff' : '#333',
          transition: 'background-color 0.3s ease, color 0.3s ease'
        }}>
          <h2 style={{ color: isDark ? '#aaa' : '#666' }}>No hay cursos disponibles</h2>
          <p style={{ color: isDark ? '#888' : '#999' }}>Contacta a tu docente para que cree un curso.</p>
        </div>
      );
    }
  }

  return (
    <div style={{ 
      background: isDark ? '#1a1a1a' : '#f8f9fa',
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box',
      color: isDark ? '#fff' : '#333',
      transition: 'background-color 0.3s ease, color 0.3s ease'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <h1 style={{ 
            margin: 0,
            color: isDark ? '#fff' : '#333',
            fontSize: '2rem',
            fontWeight: 'bold'
          }}>
            {cursoActual ? cursoActual.nombre : 'Tablero de Tareas'}
          </h1>
          {cursoActual && usuario.rol === 'docente' && (
            <p style={{ margin: '5px 0 0 0', color: isDark ? '#aaa' : '#666', fontSize: '0.9rem' }}>
              Docente: {cursoActual.docente}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {usuario.rol === 'docente' && (
            <>
              <button
                onClick={() => setCursoActual(null)}
                style={{
                  background: '#2196f3',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📚 Gestionar Cursos
              </button>
              <button
                onClick={() => setMostrarHistorial(!mostrarHistorial)}
                style={{
                  background: mostrarHistorial ? '#4caf50' : '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📊 {mostrarHistorial ? 'Ocultar' : 'Ver'} Historial
              </button>
              <button
                onClick={() => setMostrarCalificaciones(!mostrarCalificaciones)}
                style={{
                  background: mostrarCalificaciones ? '#ff9800' : '#9e9e9e',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                📊 {mostrarCalificaciones ? 'Ocultar' : 'Ver'} Calificaciones
              </button>
            </>
          )}
          {usuario.rol === 'estudiante' && (
            <button
              onClick={() => setMostrarCalificaciones(!mostrarCalificaciones)}
              style={{
                background: mostrarCalificaciones ? '#ff9800' : '#9e9e9e',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📊 {mostrarCalificaciones ? 'Ocultar' : 'Ver'} Mis Calificaciones
            </button>
          )}
        </div>
      </div>

      {mostrarHistorial && usuario.rol === 'docente' && (
        <HistorialActividad 
          historial={historial}
          estudiantes={estudiantes}
          onClose={() => setMostrarHistorial(false)}
          boardId={cursoActual?.id}
        />
      )}

      {mostrarCalificaciones && cursoActual && (
        <Calificaciones 
          usuario={usuario}
          cursoActual={cursoActual}
        />
      )}

      {usuario.rol === 'estudiante' && !mostrarCalificaciones && (
        <FiltrosEstudiante 
          filtro={filtro}
          onFiltroChange={setFiltro}
          tareas={tareas}
          usuario={usuario}
        />
      )}

      {usuario.rol === 'docente' && cursoActual && (
        <>
          <GestionCursos 
            cursos={cursos}
            estudiantes={estudiantes}
            cursoActual={cursoActual}
            onCreateCurso={crearCurso}
            onEditarCurso={editarCurso}
            onEliminarCurso={eliminarCurso}
            onAgregarEstudiante={agregarEstudiante}
            onSelectCurso={setCursoActual}
            modoCompacto={true}
          />
        </>
      )}
      
      {usuario.rol === 'docente' && (
        <NuevaTarea 
          setTareas={actualizarTareas}
          cursoId={cursoActual?.id}
          estudiantes={estudiantes}
          usuario={usuario}
          onActividad={agregarActividad}
          listsMap={listsMap}
          boardId={boardId}
          onTareaCreada={cargarTareasDesdeBackend}
          etiquetas={etiquetas}
        />
      )}
      
      <DndContext 
        collisionDetection={closestCenter} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          alignItems: 'start',
          minHeight: '500px'
        }}>
          <Columna 
            titulo="Pendiente" 
            tareas={tareasFiltradas.pendiente} 
            setTareas={actualizarTareas} 
            estado="pendiente"
            usuario={usuario}
            onActividad={agregarActividad}
            listsMap={listsMap}
            cursoId={cursoActual?.id}
            onTareaMovida={cargarTareasDesdeBackend}
            etiquetas={etiquetas}
          />
          <Columna 
            titulo="En progreso" 
            tareas={tareasFiltradas.progreso} 
            setTareas={actualizarTareas} 
            estado="progreso"
            usuario={usuario}
            onActividad={agregarActividad}
            listsMap={listsMap}
            cursoId={cursoActual?.id}
            onTareaMovida={cargarTareasDesdeBackend}
            etiquetas={etiquetas}
          />
          <Columna 
            titulo="Completada" 
            tareas={tareasFiltradas.completada} 
            setTareas={actualizarTareas} 
            estado="completada"
            usuario={usuario}
            onActividad={agregarActividad}
            listsMap={listsMap}
            cursoId={cursoActual?.id}
            onTareaMovida={cargarTareasDesdeBackend}
            etiquetas={etiquetas}
          />
        </div>
        <DragOverlay>
          {activeId ? (() => {
            // Encontrar la tarea que se está arrastrando
            let tareaActiva = null;
            Object.keys(tareasFiltradas).forEach(estado => {
              const encontrada = tareasFiltradas[estado].find(t => t.id.toString() === activeId);
              if (encontrada) {
                tareaActiva = encontrada;
              }
            });

            if (!tareaActiva) return null;

            return (
              <div style={{
                background: isDark ? '#3d3d3d' : 'white',
                padding: '12px',
                borderRadius: '8px',
                boxShadow: isDark ? '0 8px 16px rgba(0, 0, 0, 0.5)' : '0 8px 16px rgba(0, 0, 0, 0.3)',
                opacity: 0.95,
                transform: 'rotate(5deg)',
                width: '250px',
                border: '2px solid #2196f3'
              }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  fontSize: '14px', 
                  color: isDark ? '#fff' : '#333',
                  fontWeight: 'bold'
                }}>
                  {tareaActiva.texto}
                </h4>
                {tareaActiva.descripcion && (
                  <p style={{ 
                    margin: '0 0 8px 0', 
                    fontSize: '12px', 
                    color: isDark ? '#aaa' : '#666',
                    fontStyle: 'italic'
                  }}>
                    {tareaActiva.descripcion}
                  </p>
                )}
                {tareaActiva.fechaVencimiento && (
                  <p style={{ 
                    margin: '0', 
                    fontSize: '11px', 
                    color: isDark ? '#888' : '#999'
                  }}>
                    📅 {new Date(tareaActiva.fechaVencimiento).toLocaleDateString()}
                  </p>
                )}
              </div>
            );
          })() : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

export default Tablero;
