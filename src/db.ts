import Dexie, { type Table } from 'dexie';

export interface Employee {
  id?: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono: string;
  imei: string;
  modeloTelefono: string;
  tarjetaAcceso: string;
  tallaRopa: string;
  profesion: string;
  pinTelefono: string;
  nllaveEASMU?: string;
  titulaciones: string[]; // URLs or Base64 (prefer URLs if using local filesystem)
  guardias: { fecha: string; horasNormales: number; horasFestivas: number }[];
}

export interface GuardiaWeek {
  id?: number;
  anio: number;
  semana: number;
  fechaInicio: string;
  operarioNombre: string;
  operarioId?: number;
}

export interface VacationEntry {
  id?: number;
  operarioNombre: string;
  anio: number;
  tipo: 'V' | 'C' | 'F' | 'PER' | 'REC' | string;
  fecha: string; // YYYY-MM-DD
}

export interface VacationBalance {
  id?: number;
  operarioNombre: string;
  anio: number;
  vacacionesSolicitadas: number;
  vacacionesRestantes: number;
  compensatoriosSolicitados: number;
  compensatoriosRestantes: number;
  diasXHoras: number;
  festivosEnVacaciones: number;
}

export interface Supplier {
  id?: number;
  nombre: string;
  telefono: string;
  email: string;
  comercial: string;
}

export interface Order {
  id?: number;
  numeroPedido: number;
  anio: number;
  idProveedor: number;
  idEdificio: number;
  idInstalacion: string; // e.g., 'alumbrado', 'climatizacion'
  descripcion: string;
  unidades: number;
  precioPVP: number;
  descuento: number;
  precioNeto: number;
  fechaPedido: string;
  estado: 'pendiente' | 'recibido' | 'abono_pendiente' | 'abonado';
  esObra: boolean; // Manual override or auto-calc
  numeroAlbaran?: string;
  fechaAlbaran?: string;
  incidencias?: string;
}

export interface Project {
  id?: number;
  nombreObra: string;
  idEdificio: number;
  estado: 'pendiente' | 'en_proceso' | 'terminado';
  adjudicadaA?: string;
  beneficioCalculado: number;
  documentos: { tipo: string; nombre: string; ruta: string }[];
  numeroFactura?: string;
}

export interface Asset {
  id?: number;
  nombre: string;
  modelo: string;
  referencia: string;
  idEdificio: number;
  planta: string;
  peso: number;
  medidas: string;
  gamaGMAO: string;
  fotos: string[];
  manuales: string[];
  fechaUltimoCambio: string; // e.g., aceite, bateria
  periodicidadMeses: number;
}

export interface Building {
  id?: number;
  nombre: string;
}

export interface Vehicle {
  id?: number;
  matricula: string;
  modelo: string;
  color: string;
  kmsActuales: number;
  ultimaFechaKms: string;
  proximaRevision: string;
}

export interface Holiday {
  id?: number;
  fecha: string;
  nombre: string;
  tipo: 'nacional' | 'autonomico' | 'local';
}

export interface Settings {
  id?: number;
  nombreEmpresa: string;
  cifEmpresa: string;
  logoEmpresa: string;
  numeroArea: string;
  importeFranquicia: number;
  prorrateoLink?: string;
  fechaNotificacionProrrateo?: string;
  clothingLink?: string;
  fechaNotificacionRopa?: string;
  fechaNotificacionGuardia?: string;
  guardiaLink?: string;
  vacationLink?: string;
  incendiosLink?: string;
  fechaNotificacionIncendios?: string;
}

export interface ClothingItem {
  id?: number;
  nombre: string;
  precioUnitario: number;
}

export interface ClothingBatch {
  id?: number;
  anio: number;
  operarioId: number;
  prendas: { itemNombre: string; talla: string; unidades: number }[];
  costeTotal: number;
}

export interface InventoryItem {
  id?: number;
  idEquipo: string;
  edificio: string;
  tipoInstalacion: string;
  numeroUnidades: number;
  tipoMedida: string;
  descripcion: string;
  localizacion: string;
  libroMantenimientoUrl?: string; // ID of the MaintenanceBook or external URL
  estado: 'ACTIVO' | 'BAJA';
  fechaAlta?: string;
  fechaBaja?: string;
  sustituyeA?: string; // idEquipo of the replaced item
  sustituidoPor?: string; // idEquipo of the successor
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceBook {
  id?: number;
  idEquipo: string;
  // Block A (Synced)
  syncData: {
    edificio: string;
    tipoInstalacion: string;
    descripcion: string;
    localizacion: string;
    estado: string;
    fechaAlta?: string;
    fechaBaja?: string;
    sustituyeA?: string;
    sustituidoPor?: string;
    observaciones?: string;
  };
  // Block B (Manual)
  manualData: {
    fabricante: string;
    modelo: string;
    numeroSerie: string;
    caracteristicasTecnicas: string;
    planMantenimiento: string;
    registrosPreventivos: any[];
    incidencias: any[];
    averias: any[];
    mediciones: any[];
    actuacionesCorrectivas: any[];
    modificaciones: any[];
    anexos: any[];
    historialDocumental: any[];
  };
  fechaUltimaSincronizacion: string;
}

export interface MaintenanceBookSyncLog {
  id?: number;
  maintenanceBookId: number;
  fecha: string;
  accion: string;
  detalles: string;
}

export interface InventoryAuditLog {
  id?: number;
  fecha: string;
  usuario: string;
  accion: string;
  itemSelector?: string; // idEquipo or other reference
  datosPrevios?: any;
  datosNuevos?: any;
  resultado: 'EXITO' | 'ERROR';
  errorDetails?: string;
}

export interface InventoryImport {
  id?: number;
  fecha: string;
  archivoName: string;
  hojasImportadas: string[];
  totalFilas: number;
  exitos: number;
  errores: number;
  logs: string[];
}

export interface WorkOrder {
  id?: number;
  numeroParte: string;
  fecha: string;
  idOperario: number;
  idVehiculo?: number;
  idEdificio?: number;
  descripcionGeneral: string;
  kmVehiculo?: number;
  estado: 'borrador' | 'cerrado';
  assetIds: string[]; // IDs de equipos de inventario técnico
  assetIdsGMAO: number[]; // IDs de activos GMAO (furgonetas, etc)
  fechaCierre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkOrderMaterial {
  id?: number;
  workOrderId: number;
  descripcion: string;
  unidades: number;
  referencia?: string;
}

export interface RegulatoryInspection {
  id?: number;
  edificio: string;
  descripcionEdificio: string;
  instalacion: string;
  fechaUltima: string;
  fechaProx: string;
  oca: string;
  periodoAnios: number;
  observaciones: string;
  documentos: { nombre: string; url: string }[];
}

export interface InspectorCompany {
  id?: number;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  notas: string;
}

export interface ProrrateoItem {
  id?: number;
  anio: number;
  servicio: string;
  empresa: string;
  valoresMensuales: number[]; // Array of 12 numbers (Jan-Dec)
}

export class MantProDB extends Dexie {
  employees!: Table<Employee>;
  suppliers!: Table<Supplier>;
  orders!: Table<Order>;
  projects!: Table<Project>;
  assets!: Table<Asset>;
  buildings!: Table<Building>;
  vehicles!: Table<Vehicle>;
  holidays!: Table<Holiday>;
  settings!: Table<Settings>;
  clothingCatalog!: Table<ClothingItem>;
  clothingBatches!: Table<ClothingBatch>;
  inventoryItems!: Table<InventoryItem>;
  maintenanceBooks!: Table<MaintenanceBook>;
  maintenanceBookSyncLogs!: Table<MaintenanceBookSyncLog>;
  inventoryAuditLogs!: Table<InventoryAuditLog>;
  inventoryImports!: Table<InventoryImport>;
  workOrders!: Table<WorkOrder>;
  workOrderMaterials!: Table<WorkOrderMaterial>;
  regulatoryInspections!: Table<RegulatoryInspection>;
  inspectorCompanies!: Table<InspectorCompany>;
  prorrateo!: Table<ProrrateoItem>;
  guardiaWeeks!: Table<GuardiaWeek>;
  vacationEntries!: Table<VacationEntry>;
  vacationBalances!: Table<VacationBalance>;

  constructor() {
    super('MantProDB');
    this.version(1).stores({
      employees: '++id, dni, nombre',
      suppliers: '++id, nombre',
      orders: '++id, numeroPedido, idProveedor, idEdificio, estado, esObra',
      projects: '++id, nombreObra, idEdificio, estado',
      assets: '++id, nombre, idEdificio',
      buildings: '++id, nombre',
      vehicles: '++id, matricula',
      holidays: '++id, fecha',
      settings: '++id',
      clothingCatalog: '++id, nombre',
      clothingBatches: '++id, anio, operarioId'
    });
    this.version(2).stores({
      inventoryItems: '++id, idEquipo, edificio, tipoInstalacion, estado, sustituyeA, sustituidoPor',
      maintenanceBooks: '++id, idEquipo',
      maintenanceBookSyncLogs: '++id, maintenanceBookId',
      inventoryAuditLogs: '++id, fecha, accion, itemSelector',
      inventoryImports: '++id, fecha'
    });
    this.version(3).stores({
      workOrders: '++id, numeroParte, idOperario, idVehiculo, estado, fecha',
      workOrderMaterials: '++id, workOrderId'
    });
    this.version(4).stores({
      regulatoryInspections: '++id, edificio, instalacion, fechaProx'
    });
    this.version(5).stores({
      inspectorCompanies: '++id, nombre'
    });
    this.version(6).stores({
      prorrateo: '++id, anio, servicio, empresa'
    });
    this.version(9).stores({
      guardiaWeeks: '++id, [anio+semana], anio, semana, operarioNombre, fechaInicio'
    });
    this.version(12).stores({
      vacationEntries: '++id, operarioNombre, anio, fecha',
      vacationBalances: '++id, operarioNombre, anio'
    });
  }
}

export const db = new MantProDB();
