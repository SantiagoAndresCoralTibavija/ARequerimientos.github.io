Biblioteca Saber Libre AR (AR.js + A-Frame)

Este proyecto muestra la resolucion completa del caso en una experiencia AR, no como documento.
La biblioteca se presenta como un corte interior abierto para que la solucion se vea por dentro sobre el marcador.
La escena usa panel stacks con posiciones fijas en X/Y y billboarding con `aframe-look-at-component` en los contenedores padre para mantener la lectura clara.
Los paneles de Tarea 2, Tarea 3 y Solución se expanden o colapsan con click/tap sobre su bloque padre.
Las 4 etapas ahora estan orientadas a las tareas del taller:
- Tarea 1: Empatia
- Tarea 2: Filtro de valor (10 ideas -> 4 funciones)
- Tarea 3: Restricciones reales
- Solucion final validada (flujo completo)

Requisitos
- Navegador con soporte WebRTC (Chrome o Edge).
- Camara habilitada.
- Servidor local (no abrir index.html directo para evitar bloqueos de camara).

Paso 1: descargar modelos
- Revisa assets/models/LISTA_MODELOS.txt.
- Descarga modelos GLB y respeta los nombres de archivo.
- Copia los GLB en assets/models.

Paso 2: ejecutar local
Opcion con Python:
1) Abre terminal en la carpeta del proyecto.
2) Ejecuta: py -m http.server 8080
3) Abre: http://localhost:8080

Paso 3: usar AR
- Permite acceso a camara.
- Muestra un marcador HIRO impreso o en otra pantalla.
- Cambia etapas con los botones superiores (Tarea 1, Tarea 2, Tarea 3, Solucion).
- En cada etapa veras etiquetas AR con la respuesta concreta de esa tarea.

Modo PC sin marcador
- Usa el boton "Activar vista previa PC (sin marcador)" para ver la escena sin depender de deteccion HIRO.
- Tambien puedes abrir: http://localhost:8080/?preview=1
- Este modo es util para ajustar ubicacion de modelos y revisar etiquetas sin deteccion AR.

Diagnostico rapido
- Si no aparece la camara: revisa permisos del navegador.
- Si aparece "no cargo A-Frame/AR.js": desactiva bloqueador/escudos del navegador y recarga.
- Si aparece "camara activa, pero falta detectar marcador HIRO": acerca el marcador y mejora iluminacion.

Marcador HIRO
- Puedes usar el marcador oficial de AR.js buscando "AR.js HIRO marker".

Marcadores PDF generados (listos para pantalla)
- assets/markers/hiro-single.pdf (1 marcador grande)
- assets/markers/hiro-quad.pdf (4 marcadores)
- Recomendado: abrir el PDF al 100% o 125% de zoom y en pantalla completa.
- Si corres la app en PC, muestra el PDF en otro dispositivo (celular/tablet/otro monitor).

Nota
Si un modelo no carga, veras un placeholder simple para que la demo siga funcionando.
