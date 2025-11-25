function FiltrosEstudiante({ filtro, onFiltroChange, tareas, usuario }) {
  const contarTareas = (tipo) => {
    // Evitar errores si tareas está undefined o alguna categoría no existe
    const pendientes = tareas?.pendiente || [];
    const progreso = tareas?.progreso || [];
    const completadas = tareas?.completada || [];

    const todas = [...pendientes, ...progreso, ...completadas];

    // --- MIS ASIGNACIONES ---
    if (tipo === 'mis-asignaciones') {
      const miNombre = usuario?.nombre || "";

      return todas.filter(t => {
        // Seguridad extra en asignadoA
        const asignadoA = typeof t?.asignadoA === 'object'
          ? (t.asignadoA?.nombre || t.asignadoA?.username || "")
          : (t?.asignadoA || "");

        return asignadoA === miNombre;
      }).length;
    }

    // --- PRÓXIMAS A VENCER ---
    if (tipo === 'proximas-vencer') {
      const ahora = new Date();

      return todas.filter(t => {
        if (!t?.fechaVencimiento) return false;

        const fechaVenc = new Date(t.fechaVencimiento);
        const diasRestantes = Math.ceil((fechaVenc - ahora) / (1000 * 60 * 60 * 24));

        return diasRestantes <= 7 && diasRestantes >= 0;
      }).length;
    }

    // --- TODAS ---
    return todas.length;
  };

  return (
    <div style={{
      background: 'white',
      padding: '15px',
      borderRadius: '10px',
      marginBottom: '20px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#333', fontSize: '1.1rem' }}>
        🔍 Filtrar Tareas
      </h3>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

        <button
          onClick={() => onFiltroChange('todas')}
          style={{
            background: filtro === 'todas' ? '#2196f3' : '#e0e0e0',
            color: filtro === 'todas' ? 'white' : '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filtro === 'todas' ? 'bold' : 'normal'
          }}
        >
          Todas ({contarTareas('todas')})
        </button>

        <button
          onClick={() => onFiltroChange('mis-asignaciones')}
          style={{
            background: filtro === 'mis-asignaciones' ? '#4caf50' : '#e0e0e0',
            color: filtro === 'mis-asignaciones' ? 'white' : '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filtro === 'mis-asignaciones' ? 'bold' : 'normal'
          }}
        >
          Mis Asignaciones ({contarTareas('mis-asignaciones')})
        </button>

        <button
          onClick={() => onFiltroChange('proximas-vencer')}
          style={{
            background: filtro === 'proximas-vencer' ? '#ff9800' : '#e0e0e0',
            color: filtro === 'proximas-vencer' ? 'white' : '#333',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: filtro === 'proximas-vencer' ? 'bold' : 'normal'
          }}
        >
          ⏰ Próximas a Vencer ({contarTareas('proximas-vencer')})
        </button>

      </div>
    </div>
  );
}

export default FiltrosEstudiante;

