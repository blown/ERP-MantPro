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

export interface Comercial {
  nombre: string;
  telefono: string;
  email: string;
}

export interface Supplier {
  id?: number;
  nombre: string;
  descripcion?: string;
  telefono: string;
  email: string;
  nif?: string;
  codigoProveedor?: string;
  comerciales: Comercial[];
}

export interface Quotation {
  id?: number;
  idProveedor: number;
  fechaSolicitud: string;
  fechaRecepcion?: string;
  fechaEntregaEstimada?: string;
  estado: 'solicitado' | 'recibido' | 'aceptado' | 'rechazado' | 'en_obra';
  importeTotal: number;
  documentoUrl?: string;
  observaciones?: string;
  lineas?: { descripcion: string; unidades: number; idEdificio: number; tipoRepuesto?: string }[];
}

export interface Order {
  id?: number;
  idPresupuesto?: number;
  numeroPedido: number;
  anio: number;
  idProveedor: number;
  fechaPedido: string;
  fechaEntregaEstimada?: string;
  estado: 'pendiente' | 'parcialmente_recibido' | 'recibido' | 'abono_pendiente' | 'abonado';
  numeroAlbaran?: string;
  fechaAlbaran?: string;
  observaciones?: string;
}

export interface OrderItem {
  id?: number;
  idPedido: number;
  idEdificio: number;
  idInstalacion: string;
  tipoRepuesto?: string;
  idEquipo?: string; // Vinculo opcional a inventario técnico
  idObra?: number;   // Vinculo opcional a obra
  descripcion: string;
  unidades: number;
  precioPVP: number;
  descuento: number;
  precioNeto: number;
  estado: 'pendiente' | 'recibido' | 'devuelto';
  observacionesDevolucion?: string;
}

export interface Project {
  id?: number;
  idPresupuesto?: number;
  nombreObra: string;
  idEdificio: number;
  estado: 'pendiente' | 'adjudicada' | 'terminada';
  fechaAdjudicacion?: string;
  fechaTerminacion?: string;
  empresaAdjudicataria?: string;
  estadoPreparacion: 'preparar' | 'preparado';
  porcentajeGanancia: number;
  beneficioCalculado: number;
  descripcion?: string;
  items?: { descripcion: string; unidades: number; precioNeto: number; idEdificio?: number }[];
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
  direccion?: string;
  anioApertura?: number;
  superficie?: number;
  notas?: string;
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
  direccionEntrega: string;
  tiposRepuesto?: string[];
  fechaNotificacionProrrateo?: string;
  fechaNotificacionRopa?: string;
  fechaNotificacionGuardia?: string;
  fechaNotificacionIncendios?: string;
  // Signatory and export info
  firmanteNombre?: string;
  firmanteDni?: string;
  footerLine?: string;
  prorrateoLink?: string;
  clothingLink?: string;
  guardiaLink?: string;
  vacationLink?: string;
  incendiosLink?: string;
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
  planta?: string;
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

export interface UsedSparePart {
  orderId: number;
  numeroPedido: string;
  descripcion: string;
  fechaInstalacion: string;
  unidades: number;
  proveedorNombre: string;
}

export interface MaintenanceBook {
  id?: number;
  idEquipo: string;
  // Block A (Synced)
  syncData: {
    edificio: string;
    tipoInstalacion: string;
    descripcion: string;
    planta?: string;
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
    funcion?: string; // Función en la instalación
    caracteristicasTecnicas: string;
    planMantenimiento: string;
    fotos: string[]; // URLs or Base64
    manuales: { nombre: string; url: string }[];
    hojasTecnicas: { nombre: string; url: string }[];
    registrosPreventivos: any[];
    incidencias: any[];
    averias: any[];
    mediciones: any[];
    actuacionesCorrectivas: any[];
    repuestos: UsedSparePart[];
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
  idOperario?: number; // Legacy/Lead operator
  operatorIds: number[]; // Multiple operators
  idVehiculo?: number;
  idEdificio?: number;
  descripcionGeneral: string;
  kmVehiculo?: number;
  estado: 'borrador' | 'cerrado';
  assetIds: string[]; // IDs de equipos de inventario técnico
  assetIdsGMAO: number[]; // IDs de activos GMAO (furgonetas, etc)
  linkedOrderItemIds: number[]; // IDs de lineas de pedido (compras)
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
  quotations!: Table<Quotation>;
  orders!: Table<Order>;
  orderItems!: Table<OrderItem>;
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
    this.version(13).stores({
      quotations: '++id, idProveedor, estado',
      orders: '++id, numeroPedido, idProveedor, estado',
      orderItems: '++id, idPedido, idEdificio, idObra'
    });
    this.version(14).stores({
      orders: '++id, numeroPedido, idProveedor, estado, anio'
    });
    this.version(15).stores({
      suppliers: '++id, nombre'
    }).upgrade(tx => {
      return tx.table('suppliers').toCollection().modify(supplier => {
        if (!supplier.comerciales) {
          supplier.comerciales = [];
          if (supplier.comercial) {
            supplier.comerciales.push({
              nombre: supplier.comercial,
              telefono: supplier.telefono || '',
              email: supplier.email || ''
            });
            delete supplier.comercial;
          }
        }
      });
    });

    this.version(16).stores({
      workOrders: '++id, numeroParte, *operatorIds, idVehiculo, estado, fecha, *linkedOrderItemIds'
    }).upgrade(tx => {
      return tx.table('workOrders').toCollection().modify(wo => {
        if (!wo.operatorIds) {
          wo.operatorIds = wo.idOperario ? [wo.idOperario] : [];
        }
        if (!wo.linkedOrderItemIds) {
          wo.linkedOrderItemIds = [];
        }
      });
    });

    this.version(17).stores({
      orderItems: '++id, idPedido, idEdificio, idObra, estado'
    });
  }
}

export const db = new MantProDB();
