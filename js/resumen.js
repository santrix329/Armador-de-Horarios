/*
 * horario definitivo: la opcion que el usuario elige entre los resultados,
 * mostrada con su rejilla y una tabla por materia, con version imprimible
 */

// copia del horario elegido; null mientras no se elija ninguno
let horarioDefinitivo = null;

function elegirHorarioDefinitivo(horario) {
    // se guarda una copia de la lista: aunque luego cambien los resultados, el definitivo se mantiene
    horarioDefinitivo = horario.map(({ materia, seccion }) => ({ materia, seccion }));
    renderizarResumen();

    const seccion = document.getElementById("seccion-resumen");
    seccion.hidden = false;
    seccion.scrollIntoView({ behavior: "smooth", block: "start" });
    // el foco va al titulo para que el teclado y el lector de pantalla sigan al usuario
    document.getElementById("titulo-resumen").focus({ preventScroll: true });

    mostrarAviso("aviso-resultados", "Elegiste este horario como definitivo. Su resumen está al final de la página.", "exito");
}

function renderizarResumen() {
    // la misma rejilla de los resultados, pero sin interaccion
    renderizarRejilla(document.getElementById("vista-resumen-rejilla"), horarioDefinitivo);
    document.getElementById("tabla-resumen-materias").replaceChildren(crearTablaResumen(horarioDefinitivo));
}

// celda de tabla; contenido puede ser texto o una lista de nodos
function crearCelda(etiqueta, contenido) {
    const celda = document.createElement(etiqueta);
    if (typeof contenido === "string") {
        celda.textContent = contenido;
    } else {
        celda.append(...contenido);
    }
    return celda;
}

// una linea por sesion, para que horario y aula queden alineados fila a fila
function crearListaSesiones(seccion, obtenerTexto) {
    const lista = crearElemento("ul", "lista-celda");
    seccion.horario.forEach(sesion => lista.append(crearElemento("li", "", obtenerTexto(sesion))));
    return [lista];
}

// tabla por materia: codigo, nombre, seccion, profesor, horario, aula y uc, con el total al pie
function crearTablaResumen(horario) {
    const tabla = crearElemento("table", "tabla-resumen");
    tabla.append(crearElemento("caption", "", "Materias del horario definitivo"));

    const encabezado = document.createElement("thead");
    const filaEncabezado = document.createElement("tr");
    ["Código", "Materia", "Sección", "Profesor", "Horario", "Aula", "UC"].forEach(titulo => {
        const celda = crearCelda("th", titulo);
        celda.scope = "col";
        filaEncabezado.append(celda);
    });
    encabezado.append(filaEncabezado);

    const cuerpo = document.createElement("tbody");
    horario.forEach(({ materia, seccion }) => {
        const fila = document.createElement("tr");
        fila.append(
            crearCelda("td", materia.codigo),
            crearCelda("td", materia.nombre),
            crearCelda("td", seccion.id),
            crearCelda("td", seccion.profesor),
            crearCelda("td", crearListaSesiones(seccion, sesion => {
                const horas = obtenerHorarioSesionEnTexto(sesion);
                return `${NOMBRES_DIAS[sesion.dia]} ${horas.inicio}–${horas.fin}`;
            })),
            crearCelda("td", crearListaSesiones(seccion, sesion => sesion.aula)),
            crearCelda("td", String(materia.uc))
        );
        cuerpo.append(fila);
    });

    const totalUc = horario.reduce((suma, { materia }) => suma + materia.uc, 0);
    const pie = document.createElement("tfoot");
    const filaPie = document.createElement("tr");
    const etiquetaTotal = crearCelda("th", "Total de unidades de crédito");
    etiquetaTotal.scope = "row";
    etiquetaTotal.colSpan = 6;
    filaPie.append(etiquetaTotal, crearCelda("td", String(totalUc)));
    pie.append(filaPie);

    tabla.append(encabezado, cuerpo, pie);
    return tabla;
}

function iniciarResumen() {
    document.getElementById("boton-elegir").addEventListener("click", () => {
        const horario = obtenerResultadosVisibles()[indiceResultado];
        if (horario) elegirHorarioDefinitivo(horario);
    });
    // la hoja print.css oculta todo menos el resumen
    document.getElementById("btn-imprimir").addEventListener("click", () => window.print());
}
