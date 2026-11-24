/*
  Guía de Trámites y Requisitos IMSS · base de datos local (funciona sin internet)
  Autor y responsable del contenido: Ing. Luis Ángel Díaz Bernal

  FUENTE: transcripción literal de los carteles pegados en la puerta de la ventanilla
  (fotos IMG_228533 a IMG_228542, noviembre 2026). No se agregó ningún requisito que no
  esté en los carteles. Solo se corrigieron acentos y mayúsculas para que se lea mejor.

  CÓMO EDITAR
  - Cada trámite tiene "bloques" (grupos de papeles). Si el cartel no separa grupos, hay un solo bloque sin título.
  - Cada requisito: t = lo que debe traer, d = detalle del cartel (opcional), alertas = etiquetas de advertencia.
  - Tipos de alerta: "aviso" (ámbar) y "no" (rojo suave, para lo que NO se acepta).
  - Después de editar, suba el número de versión en version.json y en sw.js (el mismo número).
*/
(function () {
  "use strict";

  /* ---------- Alertas reutilizables (texto tomado de los carteles) ---------- */
  var A = {
    MES3:   { t: "No mayor a 3 meses", tipo: "aviso" },
    MES6:   { t: "No mayor a 6 meses", tipo: "aviso" },
    CARTA:  { t: "Tamaño carta", tipo: "aviso" },
    OFICIO: { t: "Tamaño oficio NO válido", tipo: "no" },
    NOCAP:  { t: "NO capturas de pantalla", tipo: "no" },
    NOREM:  { t: "NO nota de remisión, solo factura", tipo: "no" },
    VIGENTE:{ t: "Vigente", tipo: "aviso" },
    ORIG:   { t: "En original", tipo: "aviso" },
    JUZGADO:{ t: "Juzgado de lo familiar", tipo: "aviso" }
  };

  /* ---------- Requisitos que se repiten en varios carteles ---------- */
  var R = {
    actaNacCarta: { t: "Acta de nacimiento original certificada", d: "Tamaño carta.", alertas: [A.CARTA] },
    actaDefCarta: { t: "Acta de defunción original certificada", d: "Tamaño carta.", alertas: [A.CARTA] },
    ine:          { t: "INE" },
    ineVigente:   { t: "INE vigente", alertas: [A.VIGENTE] },
    domicilio:    { t: "Comprobante de domicilio", d: "Luz, agua, teléfono o gas. No mayor a 3 meses.", alertas: [A.MES3] },
    clabe:        { t: "CLABE interbancaria", d: "Estado de cuenta bancario no mayor a 3 meses o contrato bancario. No capturas de pantalla.", alertas: [A.MES3, A.NOCAP], banco: true },
    clabeCorta:   { t: "CLABE interbancaria", d: "Estado de cuenta no mayor a 3 meses o contrato.", alertas: [A.MES3], banco: true },
    nssDoc:       { t: "Documento con número de seguridad social" },
    nss:          { t: "Número de seguridad social" },
    noAdeudo:     { t: "Hoja de no adeudo", d: "Dar de baja la pensión en subdelegación." },
    matrimonio:   { t: "Acta de matrimonio o juicio de concubinato", d: "Acta de matrimonio no mayor a 3 meses, o juicio de concubinato en caso de ser concubino.", alertas: [A.MES3] },
    nssAfore:     { t: "Documento con número de seguridad social", d: "Estado de cuenta del AFORE, solo para captura." },
    actaNacMenor: { t: "Acta de nacimiento del menor" },
    cartaIdMenor: { t: "Carta de identidad del menor", d: "Expedida en presidencia." }
  };

  /* ---------- Notas y condiciones de los carteles ---------- */
  var NOTA_DOMICILIO = "El domicilio del INE y el domicilio del comprobante deben coincidir, o el comprobante de domicilio debe estar a nombre de quien hace el trámite.";
  var COND_60 = "Tener 60 años cumplidos y estar dado de baja de su trabajo al momento de presentarse en ventanilla.";

  window.GUIA = {
    institucion: "IMSS",
    horario: "8:00 a 15:00 hrs",
    horarioNota: "Hacer fila",
    reglaDeOro: "Todo debe presentarse en original y copia",

    /* Cartel "Bancos Autorizados". Un renglón del cartel está tachado con plumón y no se incluye. */
    bancos: [
      "Citibanamex", "HSBC", "Santander", "Scotiabank Inverlat", "Banca Afirme", "Banco Azteca",
      "Banco del Bajío", "Banco del Bienestar", "BanCoppel", "Banorte", "BBVA Bancomer"
    ],

    categorias: [
      { id: "pensiones",    nombre: "Pensiones" },
      { id: "viudez",       nombre: "Viudez y Orfandad" },
      { id: "pagos",        nombre: "Incapacidades y Pagos" },
      { id: "funerarios",   nombre: "Gastos Funerarios" }
    ],

    tramites: [
      /* ===================== PENSIONES ===================== */
      {
        id: "ipp-invalidez", categoria: "pensiones", icono: "invalidez",
        nombre: "IPP / Invalidez", sub: "Pensión por incapacidad permanente o invalidez",
        buscar: "ipp invalidez incapacidad permanente parcial pension",
        bloques: [{ items: [
          R.actaNacCarta, R.ine,
          { t: "Estado de cuenta AFORE", d: "No mayor a 6 meses.", alertas: [A.MES6] },
          R.domicilio, R.clabe
        ] }],
        notas: [NOTA_DOMICILIO]
      },
      {
        id: "cesantia-vejez", categoria: "pensiones", icono: "vejez",
        nombre: "Cesantía o Vejez", sub: "Pensión por edad",
        buscar: "cesantia vejez edad avanzada jubilacion retiro 60 65 años pension",
        bloques: [{ items: [R.actaNacCarta, R.ine, R.nssAfore, R.domicilio, R.clabe] }],
        condiciones: [COND_60],
        notas: [NOTA_DOMICILIO]
      },
      {
        id: "negativa-pension", categoria: "pensiones", icono: "negativa",
        nombre: "Negativa de Pensión", sub: "Trámite de negativa de pensión",
        buscar: "negativa de pension retiro afore",
        bloques: [{ items: [R.actaNacCarta, R.ine, R.nssAfore, R.domicilio] }],
        condiciones: [COND_60],
        notas: [NOTA_DOMICILIO]
      },
      {
        id: "alta-componente", categoria: "pensiones", icono: "alta",
        nombre: "Alta de Componente", sub: "Alta de beneficiario: esposa e hijos",
        buscar: "alta componente beneficiario esposa hijos familia agregar",
        bloques: [
          { titulo: "Esposa", items: [
            { t: "Acta de nacimiento original certificada" },
            R.ineVigente,
            { t: "Comprobante de domicilio", d: "No mayor a 3 meses.", alertas: [A.MES3] },
            { t: "Copia del INE del titular de la pensión" },
            { t: "Documento con el número de seguridad social del titular de la pensión" },
            { t: "Acta de matrimonio", d: "No mayor a 3 meses.", alertas: [A.MES3] }
          ] },
          { titulo: "Hijos menores de edad", items: [
            { t: "Acta de nacimiento original certificada" },
            { t: "Carta de identidad original", d: "Se expide en presidencia." },
            { t: "Copia del INE del titular de la pensión" },
            { t: "Documento con el número de seguridad social del titular de la pensión" }
          ] }
        ]
      },
      {
        id: "prorroga-estudios", categoria: "pensiones", icono: "estudios",
        nombre: "Prórroga de Estudios", sub: "Para continuar la pensión mientras estudia",
        buscar: "prorroga estudios escuela constancia estudiante",
        bloques: [{ items: [
          { t: "INE vigente del tramitante", alertas: [A.VIGENTE] },
          R.nssDoc,
          { t: "Constancia de estudios", d: "Con fecha de inicio y término del ciclo escolar y periodo vacacional (día/mes/año)." }
        ] }]
      },

      /* ===================== VIUDEZ Y ORFANDAD ===================== */
      {
        id: "viudez-trabajador", categoria: "viudez", icono: "viudez",
        nombre: "Viudez por Trabajador", sub: "El fallecido trabajaba (estaba activo)",
        buscar: "viudez viuda viudo esposo esposa fallecido trabajador muerte",
        bloques: [
          { titulo: "Papelería del fallecido (trabajador)", items: [
            R.actaDefCarta, R.actaNacCarta,
            { t: "Estado de cuenta de AFORE del finado", d: "No mayor a 6 meses.", alertas: [A.MES6] }
          ] },
          { titulo: "Papelería viuda(o)", items: [R.matrimonio, R.actaNacCarta, R.ine, R.domicilio, R.clabe] }
        ]
      },
      {
        id: "viudez-pensionado", categoria: "viudez", icono: "viudez",
        nombre: "Viudez por Pensionado", sub: "El fallecido ya era pensionado",
        buscar: "viudez viuda viudo esposo esposa fallecido pensionado muerte",
        bloques: [
          { titulo: "Papelería del fallecido (pensionado)", items: [
            { t: "Hoja de no adeudo", d: "Dar de baja pensión en subdelegación." },
            R.actaDefCarta
          ] },
          { titulo: "Papelería viuda(o)", items: [R.matrimonio, R.actaNacCarta, R.ine, R.domicilio, R.clabe] }
        ]
      },
      {
        id: "orfandad-menor", categoria: "viudez", icono: "orfandad",
        nombre: "Orfandad (menor de 16 años)", sub: "Trámite con padre o madre",
        buscar: "orfandad huerfano hijo menor niño padre madre",
        bloques: [
          { titulo: "Documentación del huérfano", items: [R.actaNacMenor, R.cartaIdMenor] },
          { titulo: "Papelería del fallecido (en caso de ser pensionado)", items: [R.actaDefCarta, R.noAdeudo] },
          { titulo: "Papelería padre o madre", items: [R.actaNacCarta, R.ine, R.domicilio, R.clabe] }
        ]
      },
      {
        id: "orfandad-menor-tutor", categoria: "viudez", icono: "tutor",
        nombre: "Orfandad (menor de 16 años con tutor)", sub: "Trámite con tutor",
        buscar: "orfandad huerfano hijo menor niño tutor tutela",
        bloques: [
          { titulo: "Documentación del huérfano", items: [R.actaNacMenor, R.cartaIdMenor] },
          { titulo: "Papelería del fallecido (en caso de ser pensionado)", items: [R.actaDefCarta, R.noAdeudo] },
          { titulo: "Papelería del tutor", items: [
            R.actaNacCarta, R.ine, R.domicilio, R.clabe,
            { t: "Juicio de tutela del menor", d: "Tramitarlo en juzgado de lo familiar y presentar libro completo.", alertas: [A.JUZGADO] }
          ] }
        ]
      },
      {
        id: "orfandad-discapacidad", categoria: "viudez", icono: "tutor",
        nombre: "Orfandad (mayor de edad con discapacidad con tutor)", sub: "Huérfano mayor de edad con discapacidad",
        buscar: "orfandad huerfano mayor de edad discapacidad invalidez tutor tutela st6",
        bloques: [
          { titulo: "Papelería del huérfano", items: [
            { t: "Acta de nacimiento original", d: "Tamaño carta.", alertas: [A.CARTA] },
            R.ineVigente,
            { t: "Dictamen de invalidez (ST6)" }
          ] },
          { titulo: "Papelería del fallecido (en caso de ser pensionado)", items: [R.actaDefCarta, R.noAdeudo],
            nota: "Si el fallecido estaba activo, se solicita estado de cuenta del AFORE y acta de nacimiento." },
          { titulo: "Papelería del tutor", items: [
            R.actaNacCarta, R.ineVigente, R.domicilio, R.clabe,
            { t: "Juicio de tutela", d: "Tramitarlo en juzgado de lo familiar y presentar libro completo.", alertas: [A.JUZGADO] }
          ] }
        ]
      },
      {
        id: "ascendientes", categoria: "viudez", icono: "ascendientes",
        nombre: "Ascendientes", sub: "Trámite de madre o padre del fallecido",
        buscar: "ascendientes madre padre papa mama dependencia economica fallecido hijo",
        bloques: [
          { titulo: "Papelería del fallecido", items: [
            R.actaDefCarta,
            { t: "Acta de nacimiento original certificada", d: "En caso de ser trabajador. Tamaño carta.", alertas: [A.CARTA] },
            { t: "Estado de cuenta de AFORE", d: "En caso de ser trabajador. No mayor a 3 meses.", alertas: [A.MES3] },
            { t: "Carta de no adeudo", d: "En caso de ser pensionado. Baja en subdelegación." }
          ] },
          { titulo: "Papelería del tramitante (madre o padre)", items: [
            { t: "Juicio de dependencia económica", d: "En juzgado de lo familiar. Presentar juicio completo.", alertas: [A.JUZGADO] },
            R.ineVigente,
            { t: "Acta de nacimiento certificada" },
            R.domicilio, R.clabe
          ] }
        ]
      },

      /* ===================== INCAPACIDADES Y PAGOS ===================== */
      {
        id: "cobro-incapacidades", categoria: "pagos", icono: "incapacidad",
        nombre: "Cobro de Incapacidades", sub: "Pago de incapacidades",
        buscar: "cobro incapacidades incapacidad pago riesgo de trabajo st7 st2",
        bloques: [{ items: [
          R.ineVigente, R.nss, R.clabeCorta,
          { t: "Incapacidades en original", d: "En caso de riesgo de trabajo: ST7 y ST2.", alertas: [A.ORIG] }
        ] }]
      },
      {
        id: "reclamacion-mensualidades", categoria: "pagos", icono: "reclamacion",
        nombre: "Reclamación de Mensualidades No Cobradas", sub: "Mensualidades de pensión no cobradas",
        buscar: "reclamacion mensualidades pension no cobradas pagos atrasados",
        bloques: [{ items: [
          R.ineVigente, R.nss,
          { t: "CLABE interbancaria", d: "Estado de cuenta no mayor a tres meses o contrato.", alertas: [A.MES3], banco: true }
        ] }]
      },
      {
        id: "informe-pago", categoria: "pagos", icono: "informe",
        nombre: "Informe de Pago", sub: "Consulta de pagos",
        buscar: "informe de pago constancia pagos",
        bloques: [{ items: [R.ineVigente, R.nssDoc] }]
      },
      {
        id: "cambio-banco", categoria: "pagos", icono: "banco",
        nombre: "Cambio de Banco (Pensionado)", sub: "Cambiar la cuenta donde recibe su pensión",
        buscar: "cambio de banco cuenta clabe pensionado",
        bloques: [{ items: [
          { t: "INE vigente del tramitante", alertas: [A.VIGENTE] },
          R.nssDoc, R.clabe
        ] }]
      },
      {
        id: "prestamo", categoria: "pagos", icono: "prestamo",
        nombre: "Préstamo", sub: "Requisitos para préstamo",
        buscar: "prestamo credito dinero",
        bloques: [{ items: [R.ineVigente, { t: "Documento con número de seguro social" }] }]
      },

      /* ===================== GASTOS FUNERARIOS ===================== */
      {
        id: "gastos-funerarios", categoria: "funerarios", icono: "funerarios",
        nombre: "Ayuda de Gastos Funerarios", sub: "Apoyo para gastos de funeral",
        buscar: "gastos funerarios funeral funeraria defuncion ayuda",
        bloques: [{ items: [
          { t: "Factura de funeraria", d: "A nombre de la persona que va a realizar el trámite. No se acepta nota de remisión, solo factura.", alertas: [A.NOREM] },
          { t: "Acta certificada de defunción", d: "Tamaño carta. Tamaño oficio no válido.", alertas: [A.CARTA, A.OFICIO] },
          { t: "INE vigente de la persona solicitante", alertas: [A.VIGENTE] },
          { t: "CURP de la persona solicitante" },
          { t: "CLABE interbancaria a nombre del solicitante", d: "Estado de cuenta bancario no mayor a 3 meses, o copia del contrato bancario a nombre del solicitante expedido por el banco. No capturas de pantalla.", alertas: [A.MES3, A.NOCAP], banco: true },
          { t: "Número de seguridad social en documento impreso", d: "En caso de ser pensionado, presentar hoja de no adeudo. La hoja de no adeudo se otorga al realizar la baja de la pensión del fallecido en el Departamento de Pensiones, ubicado en subdelegación." }
        ] }]
      }
    ]
  };
})();
