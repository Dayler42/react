import { useTheme } from './ThemeContext.jsx';
import './SwaggerUI.css';

function SwaggerUI() {
  const { isDark } = useTheme();
  const swaggerUrl = 'http://localhost:8000/api/schema/swagger-ui/';

  return (
    <div 
      className="swagger-container"
      style={{
        width: '100%',
        height: 'calc(100vh - 80px)',
        background: isDark ? '#1a1a1a' : '#f0f2f5',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          background: isDark ? '#2d2d2d' : 'white',
          padding: '15px 20px',
          borderBottom: isDark ? '1px solid #444' : '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h2 style={{ 
          margin: 0, 
          color: isDark ? '#fff' : '#333',
          fontSize: '1.2rem'
        }}>
          📚 Documentación de la API - Swagger UI
        </h2>
        <div style={{ color: isDark ? '#aaa' : '#666', fontSize: '0.9rem' }}>
          Base URL: <code style={{ 
            background: isDark ? '#1a1a1a' : '#f5f5f5',
            padding: '2px 6px',
            borderRadius: '3px',
            color: isDark ? '#4CAF50' : '#2196F3'
          }}>http://localhost:8000/api/</code>
        </div>
      </div>
      <iframe
        src={swaggerUrl}
        style={{
          width: '100%',
          height: 'calc(100% - 60px)',
          border: 'none',
          background: isDark ? '#1a1a1a' : 'white'
        }}
        title="Swagger UI"
      />
    </div>
  );
}

export default SwaggerUI;

