const XLSX = require('xlsx');
const path = require('path');

try {
  const workbook = XLSX.readFile(path.join(__dirname, 'vacaciones.xlsx'));
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  
  console.log('=== CABECERAS (Filas 0-4) ===');
  data.slice(0, 5).forEach((row, i) => {
    // Only show first 10 columns and last 10 columns
    const firstPart = row.slice(0, 10);
    const lastPart = row.slice(-10);
    console.log(`Fila ${i} Inicio: ${JSON.stringify(firstPart)}`);
    console.log(`Fila ${i} Fin: ${JSON.stringify(lastPart)}`);
  });
} catch (e) {
  console.error(e);
}
