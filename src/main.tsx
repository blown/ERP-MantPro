import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeAppData } from './init.ts'

console.log("Iniciando MantPro ERP...");
initializeAppData().then(() => {
  console.log("Base de datos inicializada correctamente");
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}).catch(err => {
  console.error("Fallo crítico en la inicialización:", err);
  document.body.innerHTML = `<div style="padding: 20px; color: red;">Error al iniciar la aplicación: ${err.message}. Revisa la consola (F12).</div>`;
});
