const XLSX = require('xlsx');
const path = require('path');

try {
  const workbook = XLSX.readFile(path.join(__dirname, 'vacaciones.xlsx'));

  console.log('=== HOJAS ===');
  console.log(workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== HOJA: "${sheetName}" ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    console.log('\n--- Primeras 10 filas ---');
    data.slice(0, 10).forEach((row, i) => {
      console.log(`Fila ${i}: ${JSON.stringify(row)}`);
    });
    
    console.log('\n--- Muestra de filas intermedias (si hay muchas) ---');
    if (data.length > 20) {
      data.slice(20, 25).forEach((row, i) => {
        console.log(`Fila ${20+i}: ${JSON.stringify(row)}`);
      });
    }
  });
} catch (e) {
  console.error('Error al leer el archivo:', e.message);
}
