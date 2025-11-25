import axios from 'axios';

// Configuración de la API
const API_BASE_URL = 'http://localhost:8001/api';

// Crear instancia de axios con configuración por defecto
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar el token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de autenticación y conexión
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si no hay respuesta del servidor (error de red, conexión rechazada, etc.)
    if (!error.response) {
      const errorMessage = error.message || 'Error desconocido';
      const isNetworkError = errorMessage.includes('Network Error') || 
                            errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                            errorMessage.includes('ECONNREFUSED') ||
                            error.code === 'ERR_NETWORK' ||
                            error.code === 'ERR_CONNECTION_REFUSED';

      if (isNetworkError) {
        console.error('❌ Error de conexión - El backend no está disponible en', API_BASE_URL);
        console.error('   Verifica que el servidor Django esté corriendo en el puerto 8001');
        console.error('   Error completo:', error);
        
        // Crear un error más descriptivo
        const networkError = new Error('El servidor no está disponible. Verifica que el backend esté corriendo.');
        networkError.isNetworkError = true;
        networkError.originalError = error;
        networkError.url = originalRequest?.url;
        
        // No redirigir si es una petición de login o registro
        if (originalRequest?.url?.includes('/token/') || originalRequest?.url?.includes('/register/')) {
          // Para login/registro, lanzar error para que el componente lo maneje
          return Promise.reject(networkError);
        }
        
        // Para otras peticiones, retornar error pero no romper la app
        return Promise.reject(networkError);
      }
      
      // Otros errores sin respuesta
      console.error('Error de red:', errorMessage);
      return Promise.reject(error);
    }

    // Si el error es 401 y no hemos intentado refrescar el token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);
          originalRequest.headers.Authorization = `Bearer ${access}`;

          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh falla, limpiar tokens
        // Solo si no es una petición de login o registro
        if (!originalRequest.url?.includes('/token/') && !originalRequest.url?.includes('/register/')) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Funciones de autenticación
export const authAPI = {
  login: async (username, password) => {
    try {
      const response = await api.post('/token/', {
        username,
        password,
      });
      return response.data;
    } catch (error) {
      // Mejorar mensaje de error para errores de red
      if (error.isNetworkError || !error.response) {
        const networkError = new Error('No se puede conectar con el servidor. Verifica que el backend esté corriendo en http://localhost:8001');
        networkError.isNetworkError = true;
        throw networkError;
      }
      console.error('Error en login:', error);
      throw error;
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post('/token/refresh/', {
        refresh: refreshToken,
      });
      return response.data;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/register/', userData);
      return response.data;
    } catch (error) {
      console.error('Error al registrar usuario:', error);
      throw error;
    }
  },
};

// Funciones de perfil
export const profileAPI = {
  getMe: async () => {
    try {
      const response = await api.get('/profiles/me/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      throw error;
    }
  },

  getStudents: async () => {
    try {
      const response = await api.get('/profiles/students/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener estudiantes del perfil:', error);
      return [];
    }
  },
};

// Funciones de usuarios
export const usersAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/users/');
      return response.data;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  },

  getStudents: async () => {
    try {
      const response = await api.get('/users/students/');
      return response.data;
    } catch (error) {
      // Si es error de red (backend no disponible), retornar array vacío silenciosamente
      if (error.isNetworkError || !error.response) {
        console.warn('⚠️ Backend no disponible - No se pudieron cargar estudiantes');
        return []; // Retornar array vacío para no romper la UI
      }
      
      // Si hay error de autenticación, re-lanzar
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.error('Error de autenticación al obtener estudiantes:', error);
        throw error;
      }
      
      // Otros errores, loguear y retornar array vacío
      console.error('Error al obtener estudiantes:', error);
      return [];
    }
  },

  search: async (query) => {
    try {
      const response = await api.get('/users/', { params: { search: query } });
      return response.data;
    } catch (error) {
      console.error('Error al buscar usuarios:', error);
      return [];
    }
  },
};

// Funciones de tableros (boards)
export const boardsAPI = {
  getAll: async () => {
    try {
      const response = await api.get('/boards/');
      // DRF devuelve paginación por defecto, extraer results si existe
      return response.data.results || response.data;
    } catch (error) {
      console.error('Error en boardsAPI.getAll:', error);
      throw error;
    }
  },

  getById: async (id) => {
    try {
      const response = await api.get(`/boards/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error en boardsAPI.getById:', error);
      throw error;
    }
  },

  create: async (boardData) => {
    try {
      console.log('Enviando datos para crear board:', boardData);
      const token = localStorage.getItem('access_token');
      console.log('Token disponible:', token ? 'Sí' : 'No');
      
      const response = await api.post('/boards/', boardData);
      console.log('Board creado exitosamente:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en boardsAPI.create:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      throw error;
    }
  },

  update: async (id, boardData) => {
    const response = await api.patch(`/boards/${id}/`, boardData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/boards/${id}/`);
    return response.data;
  },

  addStudent: async (id, userId) => {
    const response = await api.post(`/boards/${id}/add_student/`, {
      user_id: userId
    });
    return response.data;
  },

  removeStudent: async (id, userId) => {
    const response = await api.post(`/boards/${id}/remove_student/`, {
      user_id: userId
    });
    return response.data;
  },

  getActivity: async (id) => {
    const response = await api.get(`/boards/${id}/activity/`);
    return response.data;
  },
};

// Funciones de listas
export const listsAPI = {
  getAll: async (boardId = null) => {
    const params = boardId ? { board: boardId } : {};
    const response = await api.get('/lists/', { params });
    // DRF devuelve paginación por defecto, extraer results si existe
    return response.data.results || response.data;
  },

  create: async (listData) => {
    const response = await api.post('/lists/', listData);
    return response.data;
  },

  update: async (id, listData) => {
    const response = await api.patch(`/lists/${id}/`, listData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/lists/${id}/`);
    return response.data;
  },
};

// Funciones de tarjetas (cards)
export const cardsAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/cards/', { params });
    // DRF devuelve paginación por defecto, extraer results si existe
    return response.data.results || response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/cards/${id}/`);
    return response.data;
  },

  create: async (cardData) => {
    const response = await api.post('/cards/', cardData);
    return response.data;
  },

  update: async (id, cardData) => {
    try {
      console.log('cardsAPI.update - ID:', id, 'Data:', cardData);
      const response = await api.patch(`/cards/${id}/`, cardData);
      console.log('cardsAPI.update - Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error en cardsAPI.update:', error);
      console.error('Error response:', error.response);
      throw error;
    }
  },

  delete: async (id) => {
    const response = await api.delete(`/cards/${id}/`);
    return response.data;
  },

  assign: async (id, userId) => {
    const response = await api.post(`/cards/${id}/assign/`, {
      user_id: userId,
    });
    return response.data;
  },

  search: async (params) => {
    const response = await api.get('/cards/', { params });
    return response.data;
  },
};

// Funciones de comentarios
export const commentsAPI = {
  getAll: async (cardId = null) => {
    const params = cardId ? { card: cardId } : {};
    const response = await api.get('/comments/', { params });
    return response.data;
  },

  create: async (commentData) => {
    const response = await api.post('/comments/', commentData);
    return response.data;
  },

  update: async (id, commentData) => {
    const response = await api.patch(`/comments/${id}/`, commentData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/comments/${id}/`);
    return response.data;
  },
};

// Funciones de checklist
export const checklistAPI = {
  getAll: async (cardId = null) => {
    const params = cardId ? { card: cardId } : {};
    const response = await api.get('/checklist-items/', { params });
    // DRF devuelve paginación por defecto, extraer results si existe
    return response.data.results || response.data;
  },

  create: async (itemData) => {
    const response = await api.post('/checklist-items/', itemData);
    return response.data;
  },

  update: async (id, itemData) => {
    const response = await api.patch(`/checklist-items/${id}/`, itemData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/checklist-items/${id}/`);
    return response.data;
  },
};

// Funciones de etiquetas (labels)
export const labelsAPI = {
  getAll: async (boardId = null) => {
    const params = boardId ? { board: boardId } : {};
    const response = await api.get('/labels/', { params });
    // DRF devuelve paginación por defecto, extraer results si existe
    return response.data.results || response.data;
  },

  create: async (labelData) => {
    const response = await api.post('/labels/', labelData);
    return response.data;
  },

  update: async (id, labelData) => {
    const response = await api.patch(`/labels/${id}/`, labelData);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/labels/${id}/`);
    return response.data;
  },
};

// Funciones de actividad
export const activityAPI = {
  getAll: async (params = {}) => {
    const response = await api.get('/activity-logs/', { params });
    // DRF devuelve paginación por defecto, extraer results si existe
    return response.data.results || response.data;
  },

  getByBoard: async (boardId) => {
    const response = await api.get(`/boards/${boardId}/activity/`);
    return response.data;
  },
};

export default api;



