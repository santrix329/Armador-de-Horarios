/*
 * seccion de resultados: genera los horarios a partir de la seleccion,
 * informa cuantos hay y los invalida cuando la seleccion cambia
 */

// horarios de la ultima generacion; null si todavia no se genero o quedaron invalidados
let resultadosGenerados = null;

// foto de la seleccion con la que se generaron, para saber si siguen vigentes
let firmaResultados = "";

// true cuando habia resultados y despues la seleccion cambio
let resultadosDesactualizados = false;

// resultados que pasan los filtros, ya ordenados; se recalcula solo cuando
// cambia la generacion, un filtro o el orden, no en cada clic de la rejilla
let resultadosVisibles = [];

// posicion, dentro de resultadosVisibles, del horario que muestra la rejilla
let indiceResultado = 0;

// boton de sesion que abrio el detalle, para devolverle el foco al cerrarlo
let elementoQueAbrioDetalle = null;

// cada vez que cambia la lista se vuelve a la primera opcion
function recalcularVisibles() {
    resultadosVisibles = resultadosGenerados === null
        ? []
        : ordenarHorarios(filtrarHorarios(resultadosGenerados));
    indiceResultado = 0;
    cerrarDetalleSesion();
}

// resume la seleccion completa en un texto: cualquier campo que cambie
// (nombre, uc, secciones, fijadas, excluidas...) produce una firma distinta
function calcularFirmaSeleccion() {
    return JSON.stringify(obtenerMateriasSeleccionadas());
}

// cualquier cambio en la seleccion invalida los resultados mostrados
function verificarVigenciaResultados() {
    // un error de "no hay materias" deja de tener sentido apenas cambia la seleccion
    if (obtenerMateriasSeleccionadas().length > 0) {
        ocultarAviso("aviso-resultados");
    }

    if (resultadosGenerados === null) return;
    if (calcularFirmaSeleccion() === firmaResultados) return;

    resultadosGenerados = null;
    resultadosDesactualizados = true;
    recalcularVisibles();
    renderizarResultados();
}

function manejarGenerar() {
    if (obtenerMateriasSeleccionadas().length === 0) {
        mostrarAviso("aviso-resultados", "Agrega al menos una materia a tu selección antes de generar.", "error");
        return;
    }

    ocultarAviso("aviso-resultados");
    resultadosGenerados = generarHorarios();
    firmaResultados = calcularFirmaSeleccion();
    resultadosDesactualizados = false;
    recalcularVisibles();
    renderizarResultados();
}

// horarios que pasan los filtros, en el orden elegido; es la lista que pinta la rejilla
function obtenerResultadosVisibles() {
    return resultadosVisibles;
}

// indica si hay al menos un filtro de preferencias aplicado
function hayFiltrosActivos() {
    const preferencias = obtenerPreferencias();
    return preferencias.diasLibres.length > 0 || preferencias.horaMinEntrada !== "" || preferencias.horaMaxSalida !== "";
}

// texto de estado de la seccion segun haya o no resultados vigentes
function renderizarResultados() {
    const resumen = document.getElementById("resumen-resultados");
    const detalle = document.getElementById("detalle-resultados");
    detalle.replaceChildren();
    actualizarVistaResultado();

    // los filtros solo tienen sentido si hay horarios que filtrar
    const hayResultados = resultadosGenerados !== null && resultadosGenerados.length > 0;
    document.getElementById("filtros-resultados").disabled = !hayResultados;

    if (resultadosGenerados === null) {
        resumen.textContent = resultadosDesactualizados
            ? "Tu selección cambió. Vuelve a generar los horarios para ver resultados actualizados."
            : "Aún no has generado horarios. Agrega materias y pulsa \"Generar horarios\".";
        resumen.className = `resumen-resultados ${resultadosDesactualizados ? "estado-desactualizado" : "estado-vacio"}`;
        return;
    }

    if (resultadosGenerados.length === 0) {
        resumen.textContent = "No existe ninguna combinación válida: con las secciones disponibles siempre hay algún choque.";
        resumen.className = "resumen-resultados estado-error";
        detalle.append(...crearDetalleSinResultados());
        return;
    }

    const total = resultadosGenerados.length;
    const textoTotal = `${total} ${total === 1 ? "combinación válida" : "combinaciones válidas"}`;

    if (!hayFiltrosActivos()) {
        resumen.textContent = `${textoTotal}.`;
        resumen.className = "resumen-resultados estado-exito";
        return;
    }

    // la cantidad se actualiza al aplicar o retirar cada filtro
    const visibles = obtenerResultadosVisibles().length;
    resumen.textContent = `${textoTotal} · ${visibles} ${visibles === 1 ? "cumple" : "cumplen"} tus preferencias.`;

    if (visibles === 0) {
        resumen.className = "resumen-resultados estado-error";
        detalle.append(crearElemento("p", "", "Ningún horario cumple todas tus preferencias. Prueba quitar algún filtro."));
    } else {
        resumen.className = "resumen-resultados estado-exito";
    }
}

// fichas de dias y opciones de hora; todo sale de DIAS_SEMANA y BLOQUES
function construirControlesFiltros() {
    const dias = document.getElementById("opciones-dias-libres");
    dias.replaceChildren(...DIAS_SEMANA.map(dia => {
        const ficha = crearElemento("label", "ficha-dia");
        const casilla = document.createElement("input");
        casilla.type = "checkbox";
        casilla.value = dia;
        ficha.append(casilla, crearElemento("span", "", dia));
        return ficha;
    }));

    llenarSelectorHoras("filtro-entrada", obtenerHorasDeEntrada());
    llenarSelectorHoras("filtro-salida", obtenerHorasDeSalida());

    document.getElementById("orden-resultados").replaceChildren(
        ...Object.entries(CRITERIOS_ORDEN).map(([valor, texto]) => new Option(texto, valor))
    );
}

function llenarSelectorHoras(idSelector, horas) {
    document.getElementById(idSelector).replaceChildren(
        new Option("Sin límite", ""),
        ...horas.map(hora => new Option(hora, hora))
    );
}

function leerControlesFiltros() {
    return {
        diasLibres: [...document.querySelectorAll("#opciones-dias-libres input:checked")].map(c => c.value),
        horaMinEntrada: document.getElementById("filtro-entrada").value,
        horaMaxSalida: document.getElementById("filtro-salida").value
    };
}

// pone los controles igual que los filtros activos (por ejemplo, tras rechazar un cambio)
function sincronizarControlesFiltros() {
    const preferencias = obtenerPreferencias();
    document.querySelectorAll("#opciones-dias-libres input").forEach(casilla => {
        casilla.checked = preferencias.diasLibres.includes(casilla.value);
    });
    document.getElementById("filtro-entrada").value = preferencias.horaMinEntrada;
    document.getElementById("filtro-salida").value = preferencias.horaMaxSalida;
}

// un solo listener en el fieldset atiende las casillas, los selectores de hora y el de orden
function manejarCambioFiltro(evento) {
    if (evento.target.id === "orden-resultados") {
        cambiarCriterioOrden(evento.target.value);
        recalcularVisibles();
        renderizarResultados();
        return;
    }

    const resultado = actualizarPreferencias(leerControlesFiltros());

    if (!resultado.exito) {
        sincronizarControlesFiltros();
        mostrarAviso("aviso-resultados", resultado.mensaje, "error");
        return;
    }

    ocultarAviso("aviso-resultados");
    recalcularVisibles();
    renderizarResultados();
}

// quita los filtros pero conserva el orden elegido
function quitarFiltros() {
    reiniciarPreferencias();
    sincronizarControlesFiltros();
    ocultarAviso("aviso-resultados");
    recalcularVisibles();
    renderizarResultados();
}

/*
 * vista de un resultado: rejilla, navegacion, metricas y detalle de la sesion
 */

// muestra el resultado actual; claseAnimacion indica desde que lado entra la rejilla
function actualizarVistaResultado(claseAnimacion = "") {
    const vista = document.getElementById("vista-resultado");

    if (resultadosVisibles.length === 0) {
        vista.hidden = true;
        return;
    }

    vista.hidden = false;
    const horario = resultadosVisibles[indiceResultado];

    renderizarRejilla(document.getElementById("contenedor-rejilla"), horario, abrirDetalleSesion, claseAnimacion);
    renderizarMetricas(horario);

    document.getElementById("posicion-resultado").textContent =
        `Opción ${indiceResultado + 1} de ${resultadosVisibles.length}`;
    document.getElementById("boton-anterior").disabled = indiceResultado === 0;
    document.getElementById("boton-siguiente").disabled = indiceResultado === resultadosVisibles.length - 1;
}

// avanza (+1) o retrocede (-1) entre los resultados visibles
function irAResultado(desplazamiento) {
    const nuevoIndice = indiceResultado + desplazamiento;
    if (nuevoIndice < 0 || nuevoIndice >= resultadosVisibles.length) return;

    indiceResultado = nuevoIndice;
    cerrarDetalleSesion();
    actualizarVistaResultado(desplazamiento > 0 ? "entra-desde-derecha" : "entra-desde-izquierda");

    // si el boton pulsado quedo deshabilitado (primera o ultima opcion), el foco pasa al otro
    const anterior = document.getElementById("boton-anterior");
    const siguiente = document.getElementById("boton-siguiente");
    if (anterior.disabled && !siguiente.disabled) siguiente.focus();
    if (siguiente.disabled && !anterior.disabled) anterior.focus();
}

function renderizarMetricas(horario) {
    const metricas = calcularMetricas(horario);
    const filas = [
        ["Días de asistencia", String(metricas.diasAsistencia)],
        ["Horas muertas", formatearDuracion(metricas.minutosMuertos)],
        ["Entrada más temprana", convertirMinutosAHora(metricas.entradaMasTemprana)],
        ["Salida más tardía", convertirMinutosAHora(metricas.salidaMasTardia)],
        ["Salida promedio", convertirMinutosAHora(metricas.salidaPromedio)]
    ];

    document.getElementById("metricas-resultado").replaceChildren(
        ...filas.flatMap(([termino, valor]) => [crearElemento("dt", "", termino), crearElemento("dd", "", valor)])
    );
}

// al pulsar una sesion de la rejilla se muestra su detalle completo
function abrirDetalleSesion({ materia, seccion, sesion, horas }) {
    document.getElementById("detalle-sesion-titulo").textContent = `${materia.codigo} · ${materia.nombre}`;

    const filas = [
        ["Sección", seccion.id],
        ["Profesor", seccion.profesor],
        ["Día", NOMBRES_DIAS[sesion.dia]],
        ["Horario", `${horas.inicio} – ${horas.fin}`],
        ["Aula", sesion.aula],
        ["Unidades de crédito", String(materia.uc)]
    ];
    document.getElementById("detalle-sesion-datos").replaceChildren(
        ...filas.flatMap(([termino, valor]) => [crearElemento("dt", "", termino), crearElemento("dd", "", valor)])
    );

    elementoQueAbrioDetalle = document.activeElement;
    document.getElementById("detalle-sesion").classList.add("abierto");
    document.getElementById("boton-cerrar-detalle").focus();
}

function cerrarDetalleSesion() {
    const panel = document.getElementById("detalle-sesion");
    if (!panel.classList.contains("abierto")) return;

    panel.classList.remove("abierto");
    // solo se devuelve el foco si el usuario estaba dentro del detalle
    if (panel.contains(document.activeElement) && elementoQueAbrioDetalle && elementoQueAbrioDetalle.isConnected) {
        elementoQueAbrioDetalle.focus();
    }
    elementoQueAbrioDetalle = null;
}

// flechas izquierda y derecha cambian de opcion, salvo dentro de un control de formulario
function manejarTeclaVistaResultado(evento) {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(evento.target.tagName)) return;
    if (evento.key !== "ArrowLeft" && evento.key !== "ArrowRight") return;

    // si el foco estaba en una sesion, la rejilla se recrea y ese boton desaparece
    const estabaEnRejilla = evento.target.closest("#contenedor-rejilla") !== null;

    irAResultado(evento.key === "ArrowLeft" ? -1 : 1);

    // el foco pasa a la primera sesion de la nueva opcion para no perder el lugar
    if (estabaEnRejilla) {
        const primeraSesion = document.querySelector("#contenedor-rejilla .sesion-rejilla");
        if (primeraSesion) primeraSesion.focus();
    }
}

// explica por que no hubo resultados: incompatibles si los hay, o una sugerencia general
function crearDetalleSinResultados() {
    const pares = obtenerMateriasIncompatiblesSeleccionadas();

    if (pares.length === 0) {
        return [crearElemento("p", "", "Ningún par de materias es incompatible por sí solo, pero juntas no encajan. Prueba quitar una materia o liberar secciones fijadas.")];
    }

    const lista = crearElemento("ul");
    pares.forEach(par => lista.append(crearElemento("li", "", describirParIncompatible(par))));
    return [crearElemento("p", "", "Materias incompatibles detectadas:"), lista];
}

// punto de entrada de la seccion
function iniciarResultados() {
    construirControlesFiltros();
    document.getElementById("boton-generar").addEventListener("click", manejarGenerar);
    document.getElementById("filtros-resultados").addEventListener("change", manejarCambioFiltro);
    document.getElementById("boton-quitar-filtros").addEventListener("click", quitarFiltros);

    document.getElementById("boton-anterior").addEventListener("click", () => irAResultado(-1));
    document.getElementById("boton-siguiente").addEventListener("click", () => irAResultado(1));
    document.getElementById("vista-resultado").addEventListener("keydown", manejarTeclaVistaResultado);
    document.getElementById("boton-cerrar-detalle").addEventListener("click", cerrarDetalleSesion);
    document.addEventListener("keydown", evento => {
        if (evento.key === "Escape") cerrarDetalleSesion();
    });

    renderizarResultados();
}
