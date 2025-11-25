function Tarea({ texto, completada, eliminarTarea, toggleCompletada }) {
  return (
    <li style={{ margin: '8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ textDecoration: completada ? 'line-through' : 'none', flex: 1 }}>
        {texto}
      </span>
      <button onClick={toggleCompletada} style={{ padding: '4px 8px' }}>
        {completada ? '↩️' : '✔'}
      </button>
      <button onClick={eliminarTarea} style={{ padding: '4px 8px' }}>❌</button>
    </li>
  );
}

export default Tarea;

