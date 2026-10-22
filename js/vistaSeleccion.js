/*
 * panel "mi seleccion": muestra las materias elegidas con su total de uc
 * y responde a los botones de agregar y quitar; la logica vive en seleccion.js
 */

// repinta todo lo que depende de la seleccion despues de cualquier cambio
function alCambiarSeleccion() {
    renderizarSeleccion();
    actualizarBotonesAgregar();
}

// lo llama el formulario al registrar, editar o eliminar una materia manual,
// porque esos cambios pueden alterar una materia que ya estaba seleccionada
function refrescarPanelSeleccion() {
    renderizarSeleccion();
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

    if (materias.length === 0) {
        lista.replaceChildren(
            crearElemento("li", "estado-vacio", "Aún no has agregado materias. Usa el botón \"Agregar\" del catálogo.")
        );
        return;
    }

    lista.replaceChildren(...materias.map(crearItemSeleccion));
}

// tarjeta de una materia seleccionada
function crearItemSeleccion(materia) {
    const item = crearElemento("li", "item-seleccion");
    item.dataset.codigo = materia.codigo;

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
    return item;
}

// un solo listener para todos los botones del panel (delegacion de eventos):
// el panel se repinta entero en cada cambio, asi que no conviene un listener por boton
function manejarClicSeleccion(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const codigo = boton.dataset.codigo;

    if (boton.dataset.accion === "quitar") {
        quitarMateriaSeleccionada(codigo);
        mostrarAviso("aviso-seleccion", `${codigo} se quitó de tu selección.`, "info");
        alCambiarSeleccion();
    }
}

// punto de entrada del panel: registra el listener una sola vez y pinta el estado inicial
function iniciarPanelSeleccion() {
    document.getElementById("lista-seleccion").addEventListener("click", manejarClicSeleccion);
    renderizarSeleccion();
}
