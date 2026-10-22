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

function recalcularVisibles() {
    resultadosVisibles = resultadosGenerados === null
        ? []
        : ordenarHorarios(filtrarHorarios(resultadosGenerados));
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
    renderizarResultados();
}
