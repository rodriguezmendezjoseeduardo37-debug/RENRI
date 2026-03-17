export default function UnauthorizedPage() {
  return (
    <main style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <h1>Acceso no autorizado</h1>
      <p>No tienes permiso para ver esta página.</p>
      <a href="/">Volver al inicio</a>
    </main>
  );
}
