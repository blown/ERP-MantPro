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
---

## Bloque 6: Inspecciones OCA (Control Reglamentario)
Este bloque verifica que no se nos pase ninguna revisión legal importante.

1.  Ve a **Inspecciones OCA** en el menú lateral.
2.  **Importación Masiva:**
    *   Prepara un Excel (o usa uno existente) donde una fila tenga el nombre del edificio en la Columna A (ej: "EDIFICIO NORTE") y las filas siguientes tengan los datos de las máquinas (Instalación, Fecha Última, Fecha Próxima, OCA).
    *   Pulsa **"Importar Excel"** y sube el archivo.
    *   Verifica que los edificios se agrupan correctamente en "acordeones" o secciones separadas.
3.  **Sistema de Alertas (Semáforos):**
    *   Busca una inspección cuya "Próxima Inspección" sea en el pasado. El contador de días debe salir en **ROJO**.
    *   Busca una que falten menos de 30 días. Debe salir en **AMARILLO**.
    *   Verifica que el Dashboard principal (Panel de Control) ahora muestra el número correcto de "Revisiones Críticas".
4.  **Directorio de Empresas:**
    *   En la tabla de inspecciones, haz clic en el nombre de la empresa **OCA** (ej: "EUROCONTROL").
    *   El sistema debe llevarte automáticamente a la pestaña **Directorio OCA** y resaltar esa empresa.
    *   Rellena el teléfono o email de la empresa y verifica que se guarda solo al escribir.
5.  **Documentación (PDFs):**
    *   En una inspección, pulsa el icono del **documento (papel)**.
    *   Añade un enlace (puedes poner `https://google.com` como prueba) y un nombre.
    *   Cierra y vuelve a abrir para confirmar que el enlace persiste y puedes abrirlo.
6.  **Exportación:**
    *   Pulsa **"Exportar Excel"**. Abre el archivo generado y comprueba que la lista coincide con lo que ves en pantalla.
---

## Bloque 7: Personal y Disponibilidad
Este bloque verifica la gestión del equipo humano y sus ausencias.

1.  Ve a **Personal** en el menú lateral.
2.  **Gestión de Operarios:**
    *   Añade un nuevo trabajador con datos ficticios (Nombre, DNI, Teléfono).
    *   Edítalo para añadirle el "Nº de llave EASMU".
    *   Verifica que los cambios se guardan y aparecen en su tarjeta.
3.  **Cuadrante de Guardias:**
    *   Pulsa **"Cargar Guardias"** y sube el archivo `guardia.xlsx` (puedes encontrarlo en la raíz del proyecto).
    *   Pulsa **"Ver Lista"** y verifica que aparece el cuadrante semanal.
    *   Comprueba que la semana actual aparece resaltada en un color azul suave.
4.  **Vacaciones y Ausencias:**
    *   Pulsa el botón **"Cargar Vacaciones"** e importa el archivo `vacaciones.xlsx`.
    *   Verifica que el sistema indica cuántos operarios y ausencias se han cargado.
5.  **Verificación en Dashboard:**
    *   Vuelve al **Panel de Control**.
    *   Comprueba que en el cuadro de **"Personal de Guardia"** aparece el nombre del operario que toca esta semana.
    *   Verifica que en **"Disponibilidad Personal"** aparecen las ausencias de los próximos 7 días.
