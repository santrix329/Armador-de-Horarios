/*
 * panel "mi seleccion": muestra las materias elegidas con su total de uc
 * y responde a los botones de agregar y quitar; la logica vive en seleccion.js
 */

// codigos de las materias con el listado de secciones desplegado;
// se recuerda porque el panel se repinta entero en cada cambio y si no se cerraria solo
const materiasDesplegadas = new Set();

// repinta todo lo que depende de la seleccion despues de cualquier cambio
function alCambiarSeleccion() {
    renderizarSeleccion();
    actualizarBotonesAgregar();
    verificarVigenciaResultados();
}

// lo llama el formulario al registrar, editar o eliminar una materia manual,
// porque esos cambios pueden alterar una materia que ya estaba seleccionada
function refrescarPanelSeleccion() {
    renderizarSeleccion();
    // una materia manual nueva puede traer un trimestre que antes no existia
    actualizarOpcionesAtajo();
    // editar o eliminar una materia seleccionada cambia la seleccion
    verificarVigenciaResultados();
}

// las opciones del atajo salen de los trimestres que existen en los datos
function actualizarOpcionesAtajo() {
    const selector = document.getElementById("select-atajo");
    const elegido = selector.value;
    const trimestres = obtenerTrimestresDisponibles().map(String);

    selector.replaceChildren(...trimestres.map(t => new Option(`Trimestre ${t}`, t)));
    if (trimestres.includes(elegido)) {
        selector.value = elegido;
    }
}

// panel de configuracion: cambia el tope de uc
function manejarEnvioTope(evento) {
    evento.preventDefault();

    const input = document.getElementById("input-tope");
    const resultado = cambiarTopeUc(input.value);

    if (!resultado.exito) {
        input.setAttribute("aria-invalid", "true");
        mostrarAviso("aviso-seleccion", `${resultado.mensaje}.`, "error");
        input.focus();
        return;
    }

    input.removeAttribute("aria-invalid");
    mostrarAviso("aviso-seleccion", `${resultado.mensaje}.`, "exito");
    renderizarSeleccion();
}

// atajo: agrega todas las materias de un trimestre o ninguna si se pasaria del tope
function manejarEnvioAtajo(evento) {
    evento.preventDefault();

    const trimestre = document.getElementById("select-atajo").value;
    const resultado = agregarTrimestreCompleto(trimestre);

    if (!resultado.exito) {
        mostrarAviso("aviso-seleccion", `${resultado.mensaje}. No se agregó ninguna materia.`, "error");
        return;
    }

    if (resultado.agregadas === 0) {
        mostrarAviso("aviso-seleccion", `Todas las materias del trimestre ${trimestre} ya estaban en tu selección.`, "info");
        return;
    }

    const etiqueta = resultado.agregadas === 1 ? "materia" : "materias";
    mostrarAviso("aviso-seleccion", `Se agregaron ${resultado.agregadas} ${etiqueta} del trimestre ${trimestre}.`, "exito");
    alCambiarSeleccion();
}

// el boton "agregar" de una tarjeta refleja si la materia ya esta en la seleccion
function actualizarBotonAgregar(boton) {
    const yaSeleccionada = estaSeleccionada(boton.dataset.codigo);
    boton.textContent = yaSeleccionada ? "En tu selección" : "Agregar";
    boton.disabled = yaSeleccionada;
}

function actualizarBotonesAgregar() {
    document.querySelectorAll('[data-accion="agregar-materia"]').forEach(actualizarBotonAgregar);
}

// se ejecuta al pulsar "agregar" en una tarjeta del catalogo
function manejarAgregarMateria(codigo) {
    const resultado = agregarMateriaSeleccionada(codigo);

    if (!resultado.exito) {
        mostrarAviso("aviso-seleccion", `No se agregó ${codigo}: ${resultado.mensaje}.`, "error");
        return;
    }

    mostrarAviso("aviso-seleccion", `${codigo} se agregó a tu selección.`, "exito");
    alCambiarSeleccion();
}

// pinta el resumen (cantidad y uc) y una tarjeta por materia seleccionada
function renderizarSeleccion() {
    const lista = document.getElementById("lista-seleccion");
    const materias = obtenerMateriasSeleccionadas();

    const etiquetaMaterias = materias.length === 1 ? "materia" : "materias";
    document.getElementById("resumen-seleccion").textContent =
        `${materias.length} ${etiquetaMaterias} · ${calcularTotalUc()} / ${obtenerTopeUc()} UC`;

    const pares = obtenerMateriasIncompatiblesSeleccionadas();
    renderizarIncompatibles(pares);

    if (materias.length === 0) {
        lista.replaceChildren(
            crearElemento("li", "estado-vacio", "Aún no has agregado materias. Usa el botón \"Agregar\" del catálogo.")
        );
        return;
    }

    lista.replaceChildren(...materias.map(materia => crearItemSeleccion(materia, pares)));
}

// "MAT-101 (Cálculo I) y FIS-101 (Física I)"
function describirParIncompatible(par) {
    const nombre = codigo => {
        const materia = obtenerMateriaPorCodigo(codigo);
        return materia ? materia.nombre : codigo;
    };
    return `${par.materia1} (${nombre(par.materia1)}) y ${par.materia2} (${nombre(par.materia2)})`;
}

// recuadro con los pares de materias que no pueden cursarse juntas
function renderizarIncompatibles(pares) {
    const caja = document.getElementById("incompatibles-seleccion");

    if (pares.length === 0) {
        caja.replaceChildren();
        caja.hidden = true;
        return;
    }

    const lista = crearElemento("ul");
    pares.forEach(par => lista.append(crearElemento("li", "", describirParIncompatible(par))));

    caja.replaceChildren(
        crearElemento("strong", "", "Materias incompatibles"),
        crearElemento("p", "", "Todas las secciones disponibles de una chocan con todas las de la otra, así que no pueden cursarse juntas:"),
        lista
    );
    caja.hidden = false;
}

// codigos de las materias que chocan por completo con la indicada
function obtenerIncompatiblesDe(codigo, pares) {
    return pares
        .filter(par => par.materia1 === codigo || par.materia2 === codigo)
        .map(par => (par.materia1 === codigo ? par.materia2 : par.materia1));
}

// tarjeta de una materia seleccionada
function crearItemSeleccion(materia, pares = []) {
    const item = crearElemento("li", "item-seleccion");
    item.dataset.codigo = materia.codigo;

    const incompatibles = obtenerIncompatiblesDe(materia.codigo, pares);
    item.classList.toggle("item-incompatible", incompatibles.length > 0);

    const encabezado = crearElemento("div", "item-seleccion-encabezado");
    const titulo = crearElemento("p", "item-seleccion-titulo");
    titulo.append(
        crearElemento("strong", "", materia.codigo),
        ` ${materia.nombre} · ${materia.uc} UC`
    );

    const botonQuitar = crearBoton("Quitar", "quitar", "btn-texto");
    botonQuitar.dataset.codigo = materia.codigo;
    botonQuitar.setAttribute("aria-label", `Quitar ${materia.codigo} de la selección`);

    encabezado.append(titulo, botonQuitar);
    item.append(encabezado);

    if (incompatibles.length > 0) {
        item.append(crearElemento("p", "item-seleccion-alerta", `Choca por completo con ${incompatibles.join(", ")}.`));
    }

    item.append(crearDetalleSecciones(materia));
    return item;
}

// desplegable con las secciones de la materia y sus botones de fijar y excluir
function crearDetalleSecciones(materia) {
    const detalle = crearElemento("details", "secciones-seleccion");
    detalle.open = materiasDesplegadas.has(materia.codigo);
    detalle.addEventListener("toggle", () => {
        if (detalle.open) {
            materiasDesplegadas.add(materia.codigo);
        } else {
            materiasDesplegadas.delete(materia.codigo);
        }
    });

    const enUso = obtenerSeccionesDisponibles(materia).length;
    detalle.append(crearElemento("summary", "", `Secciones: ${enUso} de ${materia.secciones.length} en uso`));

    const lista = crearElemento("ul", "lista-secciones-seleccion");
    materia.secciones.forEach(seccion => lista.append(crearFilaSeccion(materia, seccion)));
    detalle.append(lista);
    return detalle;
}

// una seccion con su estado (fijada, excluida o descartada por otra fijada) y sus botones
function crearFilaSeccion(materia, seccion) {
    const fijada = materia.seccionesFijadas.includes(seccion.id);
    const excluida = materia.seccionesExcluidas.includes(seccion.id);
    // con una seccion fijada, las demas quedan fuera aunque no esten excluidas
    const descartada = !fijada && materia.seccionesFijadas.length > 0;

    const fila = crearElemento("li", "seccion-seleccion");
    fila.classList.toggle("seccion-fijada", fijada);
    fila.classList.toggle("seccion-excluida", excluida);
    fila.classList.toggle("seccion-descartada", descartada);

    let estado = "";
    if (fijada) estado = " · Fijada";
    else if (excluida) estado = " · Excluida";
    else if (descartada) estado = " · No se usa (hay otra fijada)";

    const info = crearElemento("div", "seccion-seleccion-info");
    info.append(
        crearElemento("strong", "", `Sección ${seccion.id}${estado}`),
        crearElemento("span", "", seccion.profesor),
        crearElemento("span", "seccion-seleccion-horario", describirHorario(seccion.horario))
    );

    const acciones = crearElemento("div", "seccion-seleccion-acciones");
    acciones.append(
        crearBotonSeccion("Fijar", "fijar", materia.codigo, seccion.id, fijada),
        crearBotonSeccion("Excluir", "excluir", materia.codigo, seccion.id, excluida)
    );

    fila.append(info, acciones);
    return fila;
}

// boton de alternar: aria-pressed le dice al lector de pantalla si esta activo
function crearBotonSeccion(texto, accion, codigo, idSeccion, activo) {
    const boton = crearBoton(texto, accion, "btn-secundario btn-alternar");
    boton.dataset.codigo = codigo;
    boton.dataset.seccion = idSeccion;
    boton.setAttribute("aria-pressed", String(activo));
    boton.setAttribute("aria-label", `${texto} sección ${idSeccion} de ${codigo}`);
    return boton;
}

// "LUN 07:00–08:30, MIE 07:00–08:30": horas legibles, nunca ids de bloque
function describirHorario(horario) {
    return horario.map(sesion => {
        const horas = obtenerHorarioSesionEnTexto(sesion);
        return `${sesion.dia} ${horas.inicio}–${horas.fin}`;
    }).join(", ");
}

// alterna fijar: si la seccion ya estaba fijada la libera
function alternarFijada(codigo, idSeccion) {
    const materia = obtenerMateriasSeleccionadas().find(m => m.codigo === codigo);
    if (materia.seccionesFijadas.includes(idSeccion)) {
        liberarSeccionFijada(codigo);
        mostrarAviso("aviso-seleccion", `${codigo}: la sección ${idSeccion} ya no está fijada.`, "info");
    } else {
        fijarSeccion(codigo, idSeccion);
        mostrarAviso("aviso-seleccion", `${codigo}: solo se usará la sección ${idSeccion}.`, "exito");
    }
}

// alterna excluir: si la seccion ya estaba excluida la vuelve a incluir
function alternarExcluida(codigo, idSeccion) {
    const materia = obtenerMateriasSeleccionadas().find(m => m.codigo === codigo);
    if (materia.seccionesExcluidas.includes(idSeccion)) {
        incluirSeccion(codigo, idSeccion);
        mostrarAviso("aviso-seleccion", `${codigo}: la sección ${idSeccion} vuelve a considerarse.`, "info");
        return true;
    }

    const resultado = excluirSeccion(codigo, idSeccion);
    if (!resultado.exito) {
        mostrarAviso("aviso-seleccion", `${codigo}: ${resultado.mensaje}.`, "error");
        return false;
    }
    mostrarAviso("aviso-seleccion", `${codigo}: la sección ${idSeccion} no se usará.`, "exito");
    return true;
}

// un solo listener para todos los botones del panel (delegacion de eventos):
// el panel se repinta entero en cada cambio, asi que no conviene un listener por boton
function manejarClicSeleccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const { accion, codigo, seccion } = boton.dataset;

    if (accion === "quitar") {
        quitarMateriaSeleccionada(codigo);
        materiasDesplegadas.delete(codigo);
        mostrarAviso("aviso-seleccion", `${codigo} se quitó de tu selección.`, "info");
        alCambiarSeleccion();
        return;
    }

    if (accion === "fijar") {
        alternarFijada(codigo, seccion);
    } else if (accion === "excluir") {
        if (!alternarExcluida(codigo, seccion)) return;
    } else {
        return;
    }

    alCambiarSeleccion();

    // el boton pulsado se recreo al repintar: se le devuelve el foco para no perder el lugar con el teclado
    const selector = `#lista-seleccion button[data-accion="${accion}"]` +
        `[data-codigo="${CSS.escape(codigo)}"][data-seccion="${CSS.escape(seccion)}"]`;
    const botonNuevo = document.querySelector(selector);
    if (botonNuevo) botonNuevo.focus();
}

// punto de entrada del panel: registra el listener una sola vez y pinta el estado inicial
function iniciarPanelSeleccion() {
    document.getElementById("lista-seleccion").addEventListener("click", manejarClicSeleccion);
    document.getElementById("form-tope").addEventListener("submit", manejarEnvioTope);
    document.getElementById("form-atajo").addEventListener("submit", manejarEnvioAtajo);

    document.getElementById("input-tope").value = obtenerTopeUc();
    actualizarOpcionesAtajo();
    renderizarSeleccion();
}
