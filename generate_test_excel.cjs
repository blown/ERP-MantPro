const XLSX = require('xlsx');
const path = require('path');

// Datos de ejemplo para las OCA
const data = [
    ["INSPECCIONES REGLAMENTARIAS - CONTROL DE PRUEBAS", "", "", "", "", "", ""],
    ["", "", "", "", "", "", ""],
    ["EDIFICIO ALPHA", "Calle Falsa 123, Madrid", "", "", "", "", ""],
    ["Instalación", "Tipo", "Última Realizada", "Próxima Inspección", "OCA", "Período (Años)", "Observaciones"],
    ["Baja Tensión", "Eléctrica", "10/05/2019", "10/05/2024", "EUROCONTROL", 5, "Revisión quinquenal"],
    ["Ascensor Principal", "Elevación", "15/01/2024", "15/01/2026", "TÜV SÜD", 2, "Todo correcto"],
    ["Extintores", "Incendios", "01/12/2023", "01/12/2024", "PROSEGUR", 1, "Carga realizada"],
    ["", "", "", "", "", "", ""],
    ["CENTRO LOGÍSTICO BETA", "Polígono Ind. Sector 4", "", "", "", "", ""],
    ["Instalación", "Tipo", "Última Realizada", "Próxima Inspección", "OCA", "Período (Años)", "Observaciones"],
    ["Puertas Automáticas", "Seguridad", "20/02/2023", "20/02/2024", "SGS", 1, "VENCIDA PARA PRUEBA"],
    ["Campaña de Incendios", "Incendios", "05/05/2024", "05/06/2024", "OCA GLOBAL", 0.1, "PRÓXIMA (Menos 30 días)"],
    ["Climatización / RITE", "Térmica", "01/01/2022", "01/01/2027", "APPLUS", 5, "En vigor"],
];

const ws = XLSX.utils.aoa_to_sheet(data);

// Estilo básico (opcional, el importador no lo lee pero queda bien)
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Inspecciones");

const filePath = path.join(process.cwd(), 'test_ocas.xlsx');
XLSX.writeFile(wb, filePath);

console.log(`Archivo generado con éxito en: ${filePath}`);
