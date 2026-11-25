# Guía de Trámites y Requisitos IMSS

Tótem táctil vertical de 65" para que el derechohabiente elija su trámite y vea, con imágenes, los documentos que debe traer completos (original y copia) antes de pasar a ventanilla. Misma base que **IMSS Maps · UMAA 90**.

**Autor y responsable del contenido:** Ing. Luis Ángel Díaz Bernal
**Versión:** ver `version.json`

## Qué es (para TI)

- Solo archivos estáticos: HTML, CSS, JavaScript y una tipografía. Sin base de datos ni servidor.
- No pide ni guarda datos de nadie. No usa internet: los requisitos están en `data.js`.
- Funciona sin red después de la primera carga (service worker). También abre con doble clic (`file://`), sin modo sin red.

## Estructura

```
index.html      Página principal
styles.css      Diseño (colores IMSS, alto contraste, letra grande)
app.js          Lógica: menú, buscador con teclado en pantalla, lista de cotejo, bancos, inactividad, vigilante
qrcode.js       Generador de códigos QR (Kazuhiko Arase, licencia MIT), sin internet
data.js         Los 17 trámites, requisitos, alertas y bancos (transcritos de los carteles)
sw.js           Copia local para funcionar sin red
version.json    Número de versión
manifest.json   Datos de la app instalable
icons/          Ícono
fonts/          Atkinson Hyperlegible (licencia SIL OFL)
```

## Cómo se actualiza

1. Requisitos y bancos: edite `data.js` (las instrucciones están al inicio del archivo).
2. Suba el número de versión **en dos lugares, el mismo número:** `version.json` y la línea `VERSION` de `sw.js`.
3. Reemplace los archivos en el servidor. Los tótems revisan cada 15 minutos y se actualizan solos cuando nadie los usa.

**Fotos reales de documentos:** ponga cada foto en `fotos/` con el nombre de su tipo (`ine.jpg`, `acta-nacimiento.jpg`, …), quite las `//` de su renglón en `fotos` dentro de `data.js` y anótela en `ARCHIVOS` de `sw.js`. Una foto por tipo sirve para todos los trámites. Sin foto se muestra un dibujo.

## Comportamiento en el tótem

- Barra de tiempo discreta abajo; a los 50 s sin uso pregunta "¿Sigue ahí?" y a los 60 s vuelve al menú, borra las marcas y quita alto contraste / letra grande.
- Pantalla de reposo con movimiento tras 3 minutos sin uso.
- Sin clic derecho, sin selección de texto, sin zoom (pellizco, doble toque, Ctrl + rueda).
- Se recarga sola si detecta errores repetidos o pantalla vacía, y cada madrugada a las 3:00.

**Código QR:** cada trámite muestra un QR que abre `…/?t=<trámite>&movil=1` en el celular del paciente: la misma lista, sin reinicio por inactividad ni recargas. La dirección sale de `urlPublica` en `data.js`.

Pruebas: `index.html?demo=1` muestra el panel **Estado** (revisa que haya 17 trámites, categorías e íconos válidos). `index.html?t=prestamo` abre un trámite directo.

Para el navegador del tótem se recomienda modo quiosco, por ejemplo: `chrome --kiosk --disable-pinch --overscroll-history-navigation=0 https://…/index.html`.
