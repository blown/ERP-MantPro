# 🛠️ Guía de Pruebas: Ciclo Completo de Gestión (MantPro)

Sigue estos pasos en orden para comprobar la potencia del nuevo sistema de trazabilidad.

---

## Bloque 1: Compras y Presupuestos (El origen)
1.  Ve a la sección **Compras** en el menú lateral.
2.  Haz clic en la pestaña **Presupuestos / Comparativas**.
3.  Pulsa **"Solicitar Nuevo Presupuesto"** y selecciona el "Suministros Industriales S.A.". Escribe "Motores de clima" en observaciones.
4.  Una vez creado, verás el botón **"Marcar Recibido"**. Púlsalo e introduce un importe (ej: 1200).
5.  Ahora verás el botón **"Aceptar y Generar Pedido"**. Al pulsarlo, el presupuesto se convertirá en un pedido real en la pestaña de al lado.

## Bloque 2: Recepción Multilínea (La fragmentación)
1.  Ve a la pestaña **Pedidos de Compra**. Verás el pedido que acabas de generar.
2.  Haz clic en **"Detalles"** para ver las líneas.
3.  (Opcional) Crea un **"Nuevo Pedido Multilínea"** manualmente y añade dos filas:
    *   Fila 1: Para el "Edificio Central" - Instalación "Climatización".
    *   Fila 2: Para el mismo u otro edificio - Instalación "Fontanería".
4.  Simula la llegada del material: pulsa el botón verde **"Recibir"** en la lista de pedidos. Te pedirá el número de albarán (ej: ALB-2024-001).

## Bloque 3: Analíticas de Gasto
1.  Ve a la pestaña **Control de Gastos**.
2.  Comprueba que el sistema ya ha sumado el dinero de los pedidos recibidos y te muestra cuánto has gastado en cada edificio.

## Bloque 4: Libro de Mantenimiento (La vida del equipo)
1.  Ve a la sección **Mantenimiento** (Inventario Técnico).
2.  Busca cualquier equipo y pulsa en **Acciones -> Ver Libro**.
3.  Explora las nuevas pestañas:
    *   **Datos Técnicos:** Rellena la "Función en la instalación" para describir qué hace la máquina.
    *   **Fotos & Manuales:** Comprueba que tienes los huecos listos para organizar fotos y PDFs.
    *   **Repuestos Usados:** Pulsa **"Vincular Repuesto"**. Deberían aparecerte las piezas de los pedidos que marcaste como RECIBIDOS en el Bloque 2.

## Bloque 5: Sustitución y Trazabilidad
1.  En la lista de Inventario, usa el botón **"Sustituir"** en un equipo.
2.  Sigue el asistente para dar de alta la máquina nueva.
3.  Abre el libro de la máquina nueva y verifica en **"Info General"** que aparece el enlace: *"Sustituye a: [ID_VIEJO]"*.
