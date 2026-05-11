import { db } from './db';

export async function initializeAppData() {
  console.log("Iniciando diagnósticos de tablas...");
  const tables = [
    'employees', 'suppliers', 'orders', 'projects', 'assets', 
    'buildings', 'vehicles', 'holidays', 'settings', 'clothingCatalog',
    'clothingBatches', 'inventoryItems', 'maintenanceBooks', 
    'maintenanceBookSyncLogs', 'inventoryAuditLogs', 'inventoryImports',
    'workOrders', 'workOrderMaterials', 'regulatoryInspections', 
    'inspectorCompanies', 'prorrateo', 'guardiaWeeks', 'vacationEntries',
    'vacationBalances', 'quotations', 'orderItems', 'telegramInbox'
  ];
  
  for (const tableName of tables) {
    try {
      const count = await (db as any)[tableName].count();
      console.log(`Tabla ${tableName}: ${count} registros`);
    } catch (e) {
      console.error(`ERROR EN TABLA ${tableName}:`, e);
      throw e;
    }
  }

  const settingsCount = await db.settings.count();
  
  if (settingsCount === 0) {
    await db.settings.add({
      nombreEmpresa: 'Tu Empresa S.L.',
      cifEmpresa: 'B12345678',
      logoEmpresa: '',
      numeroArea: '00',
      importeFranquicia: 500, // Valor por defecto
      direccionEntrega: 'Calle del mantenimiento, 1, Oviedo'
    });
  }

  const holidaysCount = await db.holidays.count();
  if (holidaysCount === 0) {
    const holidays2026 = [
      { fecha: '2026-01-01', nombre: 'Año Nuevo', tipo: 'nacional' },
      { fecha: '2026-01-06', nombre: 'Reyes Magos', tipo: 'nacional' },
      { fecha: '2026-04-02', nombre: 'Jueves Santo', tipo: 'nacional' },
      { fecha: '2026-04-03', nombre: 'Viernes Santo', tipo: 'nacional' },
      { fecha: '2026-05-01', nombre: 'Fiesta del Trabajo', tipo: 'nacional' },
      { fecha: '2026-05-26', nombre: 'Martes de Campo', tipo: 'local' },
      { fecha: '2026-08-15', nombre: 'Asunción de la Virgen', tipo: 'nacional' },
      { fecha: '2026-09-08', nombre: 'Día de Asturias', tipo: 'autonomico' },
      { fecha: '2026-09-21', nombre: 'San Mateo', tipo: 'local' },
      { fecha: '2026-10-12', nombre: 'Fiesta Nacional', tipo: 'nacional' },
      { fecha: '2026-11-02', nombre: 'Todos los Santos (traslado)', tipo: 'nacional' },
      { fecha: '2026-12-07', nombre: 'Día de la Constitución (traslado)', tipo: 'nacional' },
      { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', tipo: 'nacional' },
      { fecha: '2026-12-25', nombre: 'Navidad', tipo: 'nacional' },
    ];
    
    //@ts-ignore
    await db.holidays.bulkAdd(holidays2026);
  }

  // Pre-load someBuildings
  const buildingsCount = await db.buildings.count();
  if (buildingsCount === 0) {
    const initialBuildings = [
      { nombre: 'Edificio Central' },
      { nombre: 'Anexo Administrativo' },
      { nombre: 'Palacio de Exposiciones' }
    ];
    await db.buildings.bulkAdd(initialBuildings);
  }
}
