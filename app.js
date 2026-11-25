/*
  Guía de Trámites y Requisitos IMSS · tótem táctil vertical de 65"
  Autor y responsable del contenido: Ing. Luis Ángel Díaz Bernal

  Los datos viven en data.js (window.GUIA): no se piden a internet, la respuesta es inmediata.
  Opciones por dirección:
    index.html            → modo tótem normal
    index.html?demo=1     → muestra el panel "Estado" con revisión de datos y errores (solo pruebas)
    index.html?t=prestamo → abre directo un trámite (útil para pruebas o para un QR futuro)
*/
(function () {
"use strict";

/* ---------- Configuración ---------- */
var params = new URLSearchParams(location.search);
var DEMO = params.get('demo') === '1';
var INACTIVO_INICIO = 60 * 1000;      // regresa al menú tras 60 s sin uso
var AVISO_ANTES = 10 * 1000;          // "¿Sigue ahí?" 10 s antes de reiniciar
var INACTIVO_REPOSO = 3 * 60 * 1000;  // pantalla de reposo tras 3 min sin uso (evita marcar la pantalla)
var REVISAR_VERSION = 15 * 60 * 1000; // busca versión nueva cada 15 min
var VERSION = '?';

/* ---------- Monitor de errores y vigilante (igual que IMSS Maps) ---------- */
var errores = [], erroresRecientes = [];
function registrarError(msg) {
  errores.push(new Date().toLocaleTimeString('es-MX') + ' · ' + msg);
  var ahora = Date.now();
  erroresRecientes = erroresRecientes.filter(function (t) { return ahora - t < 5 * 60 * 1000; });
  erroresRecientes.push(ahora);
  try { console.error('[Guía] ' + msg); } catch (_) {}
  if (erroresRecientes.length >= 5) recargar('demasiados errores');
  pintarDemo();
}
window.addEventListener('error', function (e) { registrarError('Error: ' + (e.message || 'desconocido')); });
window.addEventListener('unhandledrejection', function (e) { registrarError('Promesa rechazada: ' + String(e.reason)); });
var recargando = false;
function recargar(motivo) {
  if (recargando) return;
  recargando = true;
  try { console.warn('[Guía] Recargando: ' + motivo); } catch (_) {}
  setTimeout(function () { location.reload(); }, 3000);
}

/* ---------- Datos ---------- */
var G = window.GUIA;
var $main = document.getElementById('main');
var $acciones = document.getElementById('acciones');
if (!G || !G.tramites) {
  $main.innerHTML = '<div class="alerta aviso"><b class="tit">Estamos actualizando la información.</b>Por favor pregunte en ventanilla.</div>';
  registrarError('No se cargó data.js');
  setTimeout(function () { recargar('datos no cargados'); }, 60 * 1000);
  return;
}
var byId = {}, catById = {};
G.tramites.forEach(function (t) { byId[t.id] = t; });
G.categorias.forEach(function (c) { catById[c.id] = c; });
function totalItems(t) { return t.bloques.reduce(function (n, b) { return n + b.items.length; }, 0); }

/* ---------- Utilidades ---------- */
function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
function norm(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function svg(path, extra) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '>' + path + '</svg>';
}

/* ---------- Íconos (trazos propios, sin dependencias) ---------- */
var ICO = {
  invalidez: '<circle cx="11" cy="4" r="2"/><path d="M11 7v6h6l2 5"/><path d="M8 10a6 6 0 1 0 7 8"/>',
  vejez: '<circle cx="10" cy="4" r="2"/><path d="M10 7v7l-2 7M10 14l3 7M10 9l-3 3M10 9l5 2"/><path d="M17 11v10"/>',
  negativa: '<path d="M6 3h9l4 4v14H6z"/><path d="M10 12l5 5M15 12l-5 5"/>',
  alta: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><path d="M18 8v6M15 11h6"/>',
  estudios: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/><path d="M22 9v6"/>',
  viudez: '<circle cx="9" cy="14" r="5"/><circle cx="15" cy="14" r="5"/><path d="M10 5l2-2 2 2"/>',
  orfandad: '<circle cx="12" cy="6" r="2.5"/><path d="M12 9v6M8 11h8M10 21l2-6 2 6"/>',
  tutor: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><circle cx="12" cy="10" r="2.2"/><path d="M8.5 16c.8-1.8 2-2.6 3.5-2.6s2.7.8 3.5 2.6"/>',
  ascendientes: '<circle cx="8" cy="6" r="2.5"/><circle cx="16" cy="6" r="2.5"/><path d="M3 20c0-4 2-7 5-7s5 3 5 7M11 20c0-4 2-7 5-7s5 3 5 7"/>',
  incapacidad: '<path d="M6 3h9l4 4v14H6z"/><path d="M12.5 10v6M9.5 13h6"/>',
  reclamacion: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M14 13.5c-.5-.6-1.2-.9-2-.9-1 0-1.8.5-1.8 1.3 0 1.8 3.8.9 3.8 2.7 0 .8-.8 1.3-1.9 1.3-.9 0-1.7-.4-2.1-1M12 12v.6M12 17.9v.6"/>',
  informe: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  banco: '<path d="M3 9l9-5 9 5z"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9M3 21h18"/>',
  prestamo: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 9v.01M18 15v.01"/>',
  funerarios: '<path d="M9 21h6V10H9z"/><path d="M12 10V8"/><path d="M12 3c1.5 1.7 1.8 3 0 5-1.8-2-1.5-3.3 0-5z"/>',
  lupa: '<circle cx="10.5" cy="10.5" r="7"/><path d="M16 16l5 5"/>',
  doc: '<path d="M7 3h10v18H7z"/><path d="M4 6h3M4 18h3"/><path d="M10 8h4M10 12h4"/>',
  alerta: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  prohibido: '<circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.01"/>',
  ok: '<path d="M4 12.5l5 5L20 7"/>',
  regresar: '<path d="M10 5l-7 7 7 7M3 12h18"/>',
  borrar: '<path d="M21 6H8l-5 6 5 6h13z"/><path d="M11 9l6 6M17 9l-6 6"/>'
};
function icono(n) { return svg(ICO[n] || ICO.doc); }

/* ---------- Ilustraciones de cada tipo de documento ----------
   Dibujos genéricos (no copian ningún documento oficial). Para usar una foto real,
   agregue en data.js al requisito:  img: "fotos/ine.jpg"  (y la foto a la carpeta fotos/ y a sw.js). */
var P = '<rect x="18" y="2" width="44" height="52" rx="3" fill="#fff" stroke="#9fb1a9" stroke-width="2"/>';   // hoja
var L = function (y, w) { return '<rect x="24" y="' + y + '" width="' + (w || 32) + '" height="3" rx="1.5" fill="#c9d3ce"/>'; };
var CARD = '<rect x="6" y="9" width="68" height="40" rx="5" fill="#e3eeea" stroke="#285C4D" stroke-width="2.5"/>';
var DIB = {
  ine: CARD + '<rect x="12" y="16" width="18" height="24" rx="2" fill="#285C4D" opacity=".85"/><circle cx="21" cy="24" r="4.5" fill="#e3eeea"/><path d="M14 38c1.5-5 12.5-5 14 0" fill="#e3eeea"/><rect x="36" y="18" width="30" height="4" rx="2" fill="#285C4D"/><rect x="36" y="27" width="24" height="3" rx="1.5" fill="#9fb1a9"/><rect x="36" y="34" width="28" height="3" rx="1.5" fill="#9fb1a9"/>',
  acta: P + '<rect x="18" y="2" width="44" height="9" rx="3" fill="#B38E5D"/>' + L(16) + L(22) + L(28, 24) + '<circle cx="50" cy="44" r="7" fill="none" stroke="#B38E5D" stroke-width="2.5"/><path d="M47 44l2 2 4-4" stroke="#B38E5D" stroke-width="2" fill="none"/>' + L(42, 14),
  domicilio: P + '<path d="M26 18l9-7 9 7v10H26z" fill="#285C4D"/><rect x="33" y="22" width="4" height="6" fill="#fff"/>' + L(34) + L(40) + '<rect x="40" y="46" width="16" height="4" rx="2" fill="#B38E5D"/>',
  estado: P + L(9, 20) + '<rect x="26" y="34" width="6" height="12" fill="#285C4D"/><rect x="35" y="26" width="6" height="20" fill="#285C4D"/><rect x="44" y="20" width="6" height="26" fill="#B38E5D"/>' + L(14, 26),
  clabe: P + '<path d="M26 14l10-5 10 5z" fill="#285C4D"/><path d="M28 15v8M32.5 15v8M37 15v8M41.5 15v8M45 15v8" stroke="#285C4D" stroke-width="2"/><rect x="25" y="24" width="22" height="2.5" fill="#285C4D"/><text x="40" y="38" text-anchor="middle" font-size="7.5" font-weight="700" fill="#13322B" font-family="sans-serif">CLABE</text><text x="40" y="47" text-anchor="middle" font-size="6" fill="#4f625a" font-family="sans-serif">18 dígitos</text>',
  nss: CARD + '<text x="40" y="29" text-anchor="middle" font-size="12" font-weight="700" fill="#13322B" font-family="sans-serif">NSS</text><text x="40" y="41" text-anchor="middle" font-size="7" fill="#4f625a" font-family="sans-serif">00 00 00 0000 0</text>',
  noadeudo: P + L(9) + L(15, 22) + '<circle cx="40" cy="35" r="11" fill="#1f7a4d"/><path d="M34 35l4 4 8-8" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>',
  juicio: P + L(9) + L(15, 24) + '<rect x="27" y="26" width="20" height="8" rx="2" transform="rotate(-30 37 30)" fill="#6f5a3a"/><path d="M40 33l10 10" stroke="#6f5a3a" stroke-width="4" stroke-linecap="round"/><rect x="26" y="46" width="20" height="4" rx="2" fill="#6f5a3a"/>',
  factura: '<path d="M20 2h40v52l-5-3-5 3-5-3-5 3-5-3-5 3-5-3-5 3z" fill="#fff" stroke="#9fb1a9" stroke-width="2"/><text x="40" y="14" text-anchor="middle" font-size="7" font-weight="700" fill="#13322B" font-family="sans-serif">FACTURA</text>' + L(20) + L(26) + '<text x="52" y="42" text-anchor="end" font-size="11" font-weight="700" fill="#285C4D" font-family="sans-serif">$</text>' + L(36, 14),
  curp: CARD + '<text x="40" y="29" text-anchor="middle" font-size="12" font-weight="700" fill="#13322B" font-family="sans-serif">CURP</text><rect x="16" y="35" width="48" height="3" rx="1.5" fill="#9fb1a9"/>',
  estudios: P + '<path d="M26 16l14-7 14 7-14 7z" fill="#285C4D"/><path d="M31 19v5c5 3 13 3 18 0v-5" fill="#285C4D"/>' + L(32) + L(38) + L(44, 20),
  medico: P + L(9, 20) + '<rect x="35" y="20" width="10" height="26" rx="2" fill="#a3262e"/><rect x="27" y="28" width="26" height="10" rx="2" fill="#a3262e"/>',
  doc: P + L(10) + L(17) + L(24) + L(31, 22) + L(38) + L(45, 18)
};
// Tipo de documento de cada requisito. Cada tipo usa la foto fotos/<tipo>.jpg si está anotada en GUIA.fotos (data.js).
function tipoDoc(it) {
  var t = norm(it.t);
  if (it.tipo) return it.tipo;
  if (t.indexOf('carta de identidad') >= 0) return 'carta-identidad';
  if (/\bine\b/.test(t)) return 'ine';
  if (t.indexOf('clabe') >= 0) return 'clabe';
  if (t.indexOf('defuncion') >= 0) return 'acta-defuncion';
  if (t.indexOf('matrimonio') >= 0) return 'acta-matrimonio';
  if (t.indexOf('acta') >= 0) return 'acta-nacimiento';
  if (t.indexOf('domicilio') >= 0) return 'comprobante-domicilio';
  if (t.indexOf('afore') >= 0 || t.indexOf('estado de cuenta') >= 0) return 'estado-cuenta-afore';
  if (t.indexOf('no adeudo') >= 0) return 'hoja-no-adeudo';
  if (t.indexOf('tutela') >= 0) return 'juicio-tutela';
  if (t.indexOf('dependencia') >= 0) return 'juicio-dependencia';
  if (t.indexOf('factura') >= 0) return 'factura-funeraria';
  if (t.indexOf('curp') >= 0) return 'curp';
  if (t.indexOf('estudios') >= 0) return 'constancia-estudios';
  if (t.indexOf('dictamen') >= 0) return 'dictamen-invalidez';
  if (t.indexOf('incapacidades') >= 0) return 'incapacidad';
  if (t.indexOf('seguro social') >= 0 || t.indexOf('seguridad social') >= 0) return 'documento-nss';
  return 'doc';
}
// Dibujo de respaldo mientras no haya foto
var DIB_DE = {
  'ine': 'ine', 'carta-identidad': 'ine', 'clabe': 'clabe', 'acta-defuncion': 'acta', 'acta-matrimonio': 'acta', 'acta-nacimiento': 'acta',
  'comprobante-domicilio': 'domicilio', 'estado-cuenta-afore': 'estado', 'hoja-no-adeudo': 'noadeudo', 'juicio-tutela': 'juicio',
  'juicio-dependencia': 'juicio', 'factura-funeraria': 'factura', 'curp': 'curp', 'constancia-estudios': 'estudios',
  'dictamen-invalidez': 'medico', 'incapacidad': 'medico', 'documento-nss': 'nss', 'doc': 'doc'
};
function imagenDoc(it) {
  var tipo = tipoDoc(it), foto = it.img || (G.fotos && G.fotos[tipo]);
  if (foto) return '<img class="img-doc foto" src="' + esc(foto) + '" alt="" loading="lazy" draggable="false">';
  return '<svg class="img-doc" viewBox="0 0 80 56" aria-hidden="true">' + DIB[DIB_DE[tipo] || 'doc'] + '</svg>';
}

/* ---------- Estado de la pantalla ---------- */
var vista = { t: 'inicio', q: '', cat: '' };
var teclado = false;
var marcados = {};   // trámite → { "bloque-item": true }

/* ========== Pantalla de inicio (hub de selección) ========== */
function renderInicio() {
  var q = norm(vista.q.trim());
  var lista = G.tramites.filter(function (t) {
    if (vista.cat && t.categoria !== vista.cat) return false;
    if (!q) return true;
    var texto = norm(t.nombre + ' ' + (t.sub || '') + ' ' + (t.buscar || '') + ' ' + catById[t.categoria].nombre);
    return q.split(/\s+/).every(function (p) { return texto.indexOf(p) >= 0; });
  });
  var buscando = teclado || !!vista.q;

  var hero = buscando ? '' :
    '<section class="hero">' +
      '<h2>¿Qué trámite viene a realizar?</h2>' +
      '<ol class="pasos"><li><b>1</b>Toque su trámite</li><li><b>2</b>Revise sus documentos</li><li><b>3</b>Haga fila para ventanilla</li></ol>' +
      oroHTML() +
    '</section>';

  var buscador =
    '<button class="buscador' + (teclado ? ' activo' : '') + '" type="button" data-buscar>' + icono('lupa') +
      '<span class="txt">' + (vista.q ? esc(vista.q) : (teclado ? '' : 'Buscar trámite: viudez, incapacidad, préstamo…')) + (teclado ? '<span class="cursor"></span>' : '') + '</span>' +
    '</button>';

  var cats = '<div class="cats" role="group" aria-label="Filtrar por categoría">' +
    '<button class="cbtn' + (!vista.cat ? ' on' : '') + '" type="button" data-cat="">Todos</button>' +
    G.categorias.map(function (c) {
      return '<button class="cbtn' + (vista.cat === c.id ? ' on' : '') + '" type="button" data-cat="' + c.id + '">' + esc(c.nombre) + '</button>';
    }).join('') + '</div>';

  var titulo = vista.q ? 'Resultados para "' + esc(vista.q) + '"' : (vista.cat ? esc(catById[vista.cat].nombre) : 'Todos los trámites');
  var grid = lista.length
    ? '<div class="grid">' + lista.map(function (t) {
        var n = totalItems(t);
        return '<button class="card" type="button" data-go="' + t.id + '" data-cat="' + t.categoria + '" data-nofiltro>' +
          '<span class="ico">' + icono(t.icono) + '</span><b>' + esc(t.nombre) + '</b><small>' + n + ' documento' + (n === 1 ? '' : 's') + '</small></button>';
      }).join('') + '</div>'
    : '<p class="empty">No encontramos "' + esc(vista.q) + '". Pruebe con otra palabra o pregunte en ventanilla.</p>';

  $main.classList.toggle('con-teclado', teclado);
  $main.innerHTML = hero + buscador + cats + '<p class="label">' + titulo + ' · ' + lista.length + '</p>' + grid + (verPanel ? panelEstado() : '');
  $acciones.innerHTML = teclado ? '' : '<button class="big sec" type="button" data-bancos>' + icono('banco') + 'Bancos autorizados</button>';
  pintarTeclado();
}

function oroHTML() {
  return '<div class="oro" role="note">' + svg(ICO.doc) + '<span>' + esc(G.reglaDeOro.toUpperCase()) + '<small>Lleve cada documento en original y su copia.</small></span></div>';
}

/* ========== Detalle del trámite (lista de cotejo) ========== */
function renderTramite(t) {
  var m = marcados[t.id] || (marcados[t.id] = {});
  var total = totalItems(t), hechos = 0;
  Object.keys(m).forEach(function (k) { if (m[k]) hechos++; });

  // Restricciones clave, juntadas de todos los requisitos (sin repetir)
  var no = [], aviso = [];
  t.bloques.forEach(function (b) { b.items.forEach(function (it) { (it.alertas || []).forEach(function (a) {
    var dest = a.tipo === 'no' ? no : aviso;
    if (dest.indexOf(a.t) < 0) dest.push(a.t);
  }); }); });

  var h = '<div class="det-cab"><span class="ico">' + icono(t.icono) + '</span><div><h2>' + esc(t.nombre) + '</h2><p>' + esc(catById[t.categoria].nombre) + (t.sub ? ' · ' + esc(t.sub) : '') + '</p></div></div>';
  h += oroHTML();

  if (t.condiciones && t.condiciones.length) {
    h += '<div class="alerta no"><b class="tit">' + icono('alerta') + 'Requisito para este trámite</b><ul>' +
      t.condiciones.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul></div>';
  }
  if (no.length || aviso.length) {
    h += '<div class="alerta aviso"><b class="tit">' + icono('alerta') + 'Revise antes de formarse</b><div class="chips">' +
      no.map(function (a) { return '<span class="chip no">' + svg(ICO.prohibido, ' width="18" height="18"') + esc(a) + '</span>'; }).join('') +
      aviso.map(function (a) { return '<span class="chip aviso">' + esc(a) + '</span>'; }).join('') +
      '</div></div>';
  }
  if (t.notas && t.notas.length) {
    h += '<div class="alerta aviso"><b class="tit">' + icono('info') + 'Nota</b><ul>' + t.notas.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></div>';
  }

  h += '<div class="progreso"><div class="prog-txt">Toque cada documento que ya trae <span>' + hechos + ' de ' + total + '</span></div>' +
       '<div class="prog-bar' + (hechos === total ? ' completo' : '') + '"><i style="width:' + Math.round(hechos * 100 / total) + '%"></i></div></div>';

  h += '<p class="label">Debe traer ' + total + ' documentos' + (t.bloques.length > 1 ? ', separados en ' + t.bloques.length + ' grupos' : '') + '</p>';

  var num = 0;
  t.bloques.forEach(function (b, bi) {
    var hechosB = b.items.filter(function (_, ii) { return m[bi + '-' + ii]; }).length;
    h += '<section class="bloque">';
    if (b.titulo) h += '<h3>' + (t.bloques.length > 1 ? '<span class="n">' + (bi + 1) + '</span>' : '') + esc(b.titulo) + '<span class="cuenta">' + hechosB + ' / ' + b.items.length + '</span></h3>';
    if (b.nota) h += '<p class="nota-bloque"><b>Importante:</b> ' + esc(b.nota) + '</p>';
    h += '<ul class="items">' + b.items.map(function (it, ii) {
      var k = bi + '-' + ii, on = !!m[k];
      num++;
      return '<li><button class="item" type="button" data-item="' + k + '" aria-pressed="' + on + '">' +
        '<span class="check"><span class="num">' + num + '</span>' + svg('<path d="M4 12.5l5 5L20 7" stroke="#fff" stroke-width="3.2"/>') + '</span>' +
        imagenDoc(it) +
        '<span class="txt"><span class="t">' + esc(it.t) + '</span>' + (it.d ? '<span class="d">' + esc(it.d) + '</span>' : '') +
        ((it.alertas && it.alertas.length) ? '<span class="chips">' + it.alertas.map(function (a) { return '<span class="chip ' + a.tipo + '">' + esc(a.t) + '</span>'; }).join('') + '</span>' : '') +
        '<span class="estado">' + (on ? '✓ Listo, lo traigo' : 'Toque si ya lo trae') + '</span></span>' +
      '</button></li>';
    }).join('') + '</ul></section>';
  });

  if (hechos === total) {
    h += '<div class="listo" role="status">' + svg(ICO.ok, ' stroke-width="3"') + '<span>¡Tiene todos sus documentos! Recuerde llevar original y copia. Haga fila para pasar a ventanilla.</span></div>';
  }
  h += '<p class="fuente">Información de los carteles de requisitos de la ventanilla. Si tiene dudas, pregunte en ventanilla.</p>';
  if (verPanel) h += panelEstado();

  $main.classList.remove('con-teclado');
  $main.innerHTML = h;
  $acciones.innerHTML =
    '<button class="big regresar" type="button" data-home>' + icono('regresar') + 'Regresar al menú de trámites</button>' +
    '<button class="big sec" type="button" data-bancos>' + icono('banco') + 'Bancos autorizados</button>';
}

/* ---------- Dibujo general ---------- */
function render(mantenerScroll) {
  var y = $main.scrollTop;
  if (vista.t === 'tramite' && byId[vista.id]) renderTramite(byId[vista.id]);
  else { vista.t = 'inicio'; renderInicio(); }
  if (mantenerScroll) $main.scrollTop = y; else $main.scrollTop = 0;
  pintarDemo();
}

/* ========== Teclado en pantalla ========== */
var $teclado = document.getElementById('teclado');
var FILAS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
function pintarTeclado() {
  $teclado.hidden = !teclado;
  if (!teclado || $teclado.childElementCount) return;
  $teclado.innerHTML = FILAS.map(function (f, i) {
    return '<div class="fila-t">' + f.split('').map(function (l) { return '<button class="tecla" type="button" data-tecla="' + l + '">' + l + '</button>'; }).join('') +
      (i === 2 ? '<button class="tecla media borrar" type="button" data-tecla="⌫" aria-label="Borrar letra">' + svg(ICO.borrar, ' width="34" height="34"') + '</button>' : '') + '</div>';
  }).join('') +
  '<div class="fila-t"><button class="tecla media borrar" type="button" data-tecla="limpiar">Borrar todo</button>' +
  '<button class="tecla ancha" type="button" data-tecla=" ">Espacio</button>' +
  '<button class="tecla media accion" type="button" data-tecla="listo">Listo</button></div>';
}
function tecla(k) {
  if (k === 'listo') { teclado = false; }
  else if (k === 'limpiar') { vista.q = ''; }
  else if (k === '⌫') { vista.q = vista.q.slice(0, -1); }
  else if (vista.q.length < 30) { vista.q += (k === ' ' ? ' ' : k.toLowerCase()); }
  renderInicio();
}

/* ========== Accesibilidad ========== */
var $a11yBtn = document.getElementById('a11yBtn'), $a11yPanel = document.getElementById('a11yPanel');
function abrirA11y(abrir) { $a11yPanel.hidden = !abrir; $a11yBtn.setAttribute('aria-expanded', String(abrir)); }
function a11y(clase, on) {
  document.documentElement.classList.toggle(clase, on);
  var b = $a11yPanel.querySelector('[data-a11y="' + clase + '"]');
  if (b) b.setAttribute('aria-pressed', String(on));
}

/* ========== Bancos autorizados ========== */
var $modal = document.getElementById('modalBancos');
document.getElementById('listaBancos').innerHTML = G.bancos.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('');
function abrirBancos(abrir) { $modal.hidden = !abrir; }

/* ========== Eventos (un solo escucha para todo) ========== */
document.body.addEventListener('click', function (e) {
  var el;
  if ((el = e.target.closest('[data-tecla]'))) { tecla(el.getAttribute('data-tecla')); return; }
  if ((el = e.target.closest('[data-item]'))) {
    var m = marcados[vista.id] || (marcados[vista.id] = {}), k = el.getAttribute('data-item');
    m[k] = !m[k]; render(true); return;
  }
  if ((el = e.target.closest('[data-go]'))) { vista = { t: 'tramite', id: el.getAttribute('data-go') }; teclado = false; render(); return; }
  if ((el = e.target.closest('[data-cat]')) && !el.hasAttribute('data-nofiltro')) { vista.cat = el.getAttribute('data-cat'); render(); return; }
  if (e.target.closest('[data-buscar]')) { teclado = true; renderInicio(); $main.scrollTop = 0; return; }
  if (e.target.closest('[data-home]')) { irAlInicio(false); return; }
  if (e.target.closest('[data-bancos]')) { abrirBancos(true); return; }
  if (e.target.closest('[data-cerrar-modal]') || e.target === $modal) { abrirBancos(false); return; }
  if (e.target.closest('#a11yBtn')) { abrirA11y($a11yPanel.hidden); return; }
  if ((el = e.target.closest('[data-a11y]'))) { var c = el.getAttribute('data-a11y'); a11y(c, !document.documentElement.classList.contains(c)); return; }
  if (e.target.closest('[data-a11y-cerrar]')) { abrirA11y(false); return; }
  if (e.target.closest('[data-panel]')) { verPanel = !verPanel; render(true); return; }
  if (!$a11yPanel.hidden && !e.target.closest('#a11yPanel')) abrirA11y(false);
});

/* Vuelve al menú. "total" también quita accesibilidad y marcas (cuando la persona se fue). */
function irAlInicio(total) {
  vista = { t: 'inicio', q: '', cat: '' };
  teclado = false;
  abrirBancos(false);
  abrirA11y(false);
  if (total) { marcados = {}; a11y('hc', false); a11y('lg', false); verPanel = false; }
  render();
}

/* ---------- Modo quiosco: sin menú, sin selección, sin zoom ---------- */
['contextmenu', 'selectstart', 'dragstart', 'gesturestart', 'gesturechange'].forEach(function (ev) {
  document.addEventListener(ev, function (e) { e.preventDefault(); }, { passive: false });
});
document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && ['+', '-', '=', '0'].indexOf(e.key) >= 0) e.preventDefault();
});
var ultimoToque = 0;   // evita el zoom por doble toque en navegadores que lo ignoran en CSS
document.addEventListener('touchend', function (e) {
  var ahora = Date.now();
  if (ahora - ultimoToque < 300 && !e.target.closest('button')) e.preventDefault();
  ultimoToque = ahora;
}, { passive: false });

/* ========== Reloj ========== */
var $hora = document.getElementById('hora'), $fecha = document.getElementById('fecha');
function reloj() {
  var d = new Date();
  $hora.textContent = d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false });
  var f = d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  $fecha.textContent = f.charAt(0).toUpperCase() + f.slice(1);
}
reloj(); setInterval(reloj, 15 * 1000);
document.getElementById('horario').textContent = G.horario;
document.getElementById('horarioNota').textContent = G.horarioNota || '';

/* ========== Inactividad: barra, aviso, regreso al menú y reposo ========== */
var $idle = document.getElementById('idle'), $idleFill = document.getElementById('idleFill');
var $sigue = document.getElementById('sigue'), $sigueSeg = document.getElementById('sigueSeg');
var $reposo = document.getElementById('reposo'), $reposoCard = document.getElementById('reposoCard'), $reposoDest = document.getElementById('reposoDest');
var ultimaActividad = Date.now(), tMover = null;

// ¿Hay algo que reiniciar? En el menú limpio no se muestra la barra.
function hayQueReiniciar() {
  var html = document.documentElement.classList;
  return vista.t !== 'inicio' || vista.q || vista.cat || teclado || !$modal.hidden || !$a11yPanel.hidden ||
    html.contains('hc') || html.contains('lg') || Object.keys(marcados).length > 0;
}
function actividad() {
  ultimaActividad = Date.now();
  $sigue.hidden = true;
}
['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function (ev) { document.addEventListener(ev, actividad, { passive: true, capture: true }); });

function moverReposo() {
  $reposoCard.style.left = (5 + Math.random() * 40) + '%';
  $reposoCard.style.top = (8 + Math.random() * 55) + '%';
  var t = G.tramites[Math.floor(Math.random() * G.tramites.length)];
  $reposoDest.textContent = t.nombre + ' · ' + totalItems(t) + ' documentos';
}
function mostrarReposo() { if (!$reposo.hidden) return; $reposo.hidden = false; moverReposo(); tMover = setInterval(moverReposo, 8000); }
// El toque que quita el reposo no debe abrir nada que esté debajo
$reposo.addEventListener('click', function (e) { e.stopPropagation(); e.preventDefault(); $reposo.hidden = true; clearInterval(tMover); actividad(); });

setInterval(function () {
  var pasado = Date.now() - ultimaActividad;
  var reiniciar = hayQueReiniciar();
  $idle.hidden = !reiniciar;
  if (reiniciar) {
    var resta = Math.max(0, INACTIVO_INICIO - pasado);
    $idleFill.style.transform = 'scaleX(' + (resta / INACTIVO_INICIO).toFixed(3) + ')';
    if (resta <= AVISO_ANTES && resta > 0) { $sigue.hidden = false; $sigueSeg.textContent = Math.ceil(resta / 1000); }
    if (resta === 0) { $sigue.hidden = true; irAlInicio(true); }
  }
  if (pasado >= INACTIVO_REPOSO) mostrarReposo();
}, 250);

/* ========== Modo demo (solo con ?demo=1): revisión de datos ========== */
var verPanel = false;
function validar() {
  var av = [], ids = {};
  G.tramites.forEach(function (t) {
    if (ids[t.id]) av.push('ID duplicado: ' + t.id);
    ids[t.id] = true;
    if (!catById[t.categoria]) av.push(t.nombre + ': categoría desconocida "' + t.categoria + '"');
    if (!ICO[t.icono]) av.push(t.nombre + ': ícono desconocido "' + t.icono + '"');
    if (!t.bloques || !t.bloques.length) av.push(t.nombre + ': sin requisitos');
    (t.bloques || []).forEach(function (b) { b.items.forEach(function (it) { if (!it.t) av.push(t.nombre + ': requisito sin texto'); }); });
  });
  if (G.tramites.length !== 17) av.push('Hay ' + G.tramites.length + ' trámites (se esperaban 17)');
  return av;
}
function panelEstado() {
  var av = validar();
  return '<div class="panel"><b>Estado de datos</b> · ' + G.tramites.length + ' trámites, ' + av.length + ' avisos, ' + errores.length + ' errores · versión ' + esc(VERSION) +
    '<ul>' + av.concat(errores).map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>';
}
function pintarDemo() {
  if (!DEMO) return;
  var bar = document.getElementById('demoBar');
  var n = validar().length + errores.length;
  bar.hidden = false; bar.className = 'demo';
  bar.innerHTML = '<button type="button" data-panel>Estado' + (n ? ' · <b>' + n + '</b>' : ' · OK') + '</button>';
}

/* ========== Vigilante: pantalla vacía, versión nueva y recarga diaria ========== */
var inicioApp = Date.now();
setInterval(function () {
  if (!$main.children.length) recargar('pantalla vacía');
  var h = new Date();
  if (h.getHours() === 3 && h.getMinutes() < 5 && Date.now() - inicioApp > 60 * 60 * 1000) recargar('recarga diaria');
}, 60 * 1000);

var esperandoRecarga = false;
function revisarVersion() {
  if (esperandoRecarga || location.protocol === 'file:') return;
  fetch('version.json?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (v) {
    if (VERSION !== '?' && v.version !== VERSION) {
      if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
        navigator.serviceWorker.getRegistration().then(function (reg) { if (reg) reg.update(); });
      }
      esperandoRecarga = true;
      var esperar = setInterval(function () { if (!hayQueReiniciar() || !$reposo.hidden) { clearInterval(esperar); recargar('versión nueva ' + v.version); } }, 30000);
    }
  }).catch(function () { /* sin red: sigue con la copia guardada */ });
}

/* ========== PWA: copia local para funcionar sin red ========== */
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(function (e) { registrarError('No se registró el modo sin internet: ' + e.message); });
}

/* ========== Arranque ========== */
var directo = params.get('t');
if (directo && byId[directo]) vista = { t: 'tramite', id: directo };
render();
if (location.protocol !== 'file:') {
  fetch('version.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (v) {
    VERSION = v.version || '?';
    document.getElementById('ver').textContent = 'v' + VERSION;
    pintarDemo();
  }).catch(function () {});
  setInterval(revisarVersion, REVISAR_VERSION);
}

})();
