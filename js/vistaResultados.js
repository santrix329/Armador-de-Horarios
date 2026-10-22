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

// resume la seleccion en un texto: cambiar una materia, sus secciones,
// las fijadas o las excluidas produce una firma distinta
function calcularFirmaSeleccion() {
    return JSON.stringify(obtenerMateriasSeleccionadas().map(m =>
        [m.codigo, m.secciones, m.seccionesFijadas, m.seccionesExcluidas]
    ));
}

// cualquier cambio en la seleccion invalida los resultados mostrados
function verificarVigenciaResultados() {
    if (resultadosGenerados === null) return;
    if (calcularFirmaSeleccion() === firmaResultados) return;

    resultadosGenerados = null;
    resultadosDesactualizados = true;
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
    renderizarResultados();
}

// horarios que pasan los filtros; es la lista que debe pintar la rejilla
function obtenerResultadosVisibles() {
    if (resultadosGenerados === null) return [];
    return filtrarHorarios(resultadosGenerados);
}

// texto de estado de la seccion segun haya o no resultados vigentes
function renderizarResultados() {
    const resumen = document.getElementById("resumen-resultados");
    const detalle = document.getElementById("detalle-resultados");
    detalle.replaceChildren();

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
    resumen.textContent = `${total} ${total === 1 ? "combinación válida" : "combinaciones válidas"}.`;
    resumen.className = "resumen-resultados estado-exito";
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
    document.getElementById("boton-generar").addEventListener("click", manejarGenerar);
    renderizarResultados();
}
