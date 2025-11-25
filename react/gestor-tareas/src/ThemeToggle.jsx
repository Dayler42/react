import { useTheme } from './ThemeContext.jsx';

function ThemeToggle() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        background: isDark ? '#444' : '#fff',
        border: `2px solid ${isDark ? '#666' : '#ddd'}`,
        borderRadius: '25px',
        padding: '8px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '14px',
        color: isDark ? '#fff' : '#333',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      }}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {isDark ? '🌙' : '☀️'}
      <span style={{ fontWeight: 'bold' }}>
        {isDark ? 'Modo Oscuro' : 'Modo Claro'}
      </span>
    </button>
  );
}

export default ThemeToggle;

