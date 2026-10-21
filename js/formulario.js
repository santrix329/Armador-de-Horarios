/*
 * formulario de registro de materias manuales
 * arma el dom, lee los campos y muestra cada error junto a su control;
 * las reglas viven en validaciones.js
 */

// codigo de la materia que se esta editando; null cuando se registra una nueva
let codigoEnEdicion = null;

// contador para generar ids unicos y enlazar cada label con su control
let contadorCamposFormulario = 0;

// crea un input con valor y atributos opcionales
function crearInput(tipo, valor = "", atributos = {}) {
    const input = document.createElement("input");
    input.type = tipo;
    input.value = valor;
    Object.entries(atributos).forEach(([nombre, valorAtributo]) => input.setAttribute(nombre, valorAtributo));
    return input;
}

// envuelve un control con su label y el espacio para su error
// nombre identifica el campo dentro de su nivel (materia, seccion o sesion)
function crearCampo(textoEtiqueta, control, nombre) {
    const id = `campo-form-${++contadorCamposFormulario}`;
    const campo = crearElemento("div", "campo-form");
    campo.dataset.campo = nombre;

    const etiqueta = crearElemento("label", "", textoEtiqueta);
    etiqueta.htmlFor = id;

    const error = crearElemento("span", "error-campo");
    error.id = `${id}-error`;

    control.id = id;
    control.name = nombre;
    control.setAttribute("aria-describedby", error.id);

    campo.append(etiqueta, control, error);
    return campo;
}

// casillas de bloques agrupadas por tipo; los tipos y las horas salen de BLOQUES
function crearCampoBloques(idsSeleccionados = []) {
    const campo = crearElemento("fieldset", "campo-form campo-bloques");
    campo.dataset.campo = "bloques";
    campo.append(crearElemento("legend", "", "Bloques"));

    const tipos = [...new Set(BLOQUES.map(b => b.tipo))];
    tipos.forEach(tipo => {
        const grupo = crearElemento("div", "grupo-bloques");
        const titulo = tipo.charAt(0).toUpperCase() + tipo.slice(1);
        grupo.append(crearElemento("span", "grupo-bloques-titulo", titulo));

        const fichas = crearElemento("div", "fichas-bloques");
        BLOQUES
            .filter(b => b.tipo === tipo)
            .sort((a, b) => convertirHoraAMinutos(a.inicio) - convertirHoraAMinutos(b.inicio))
            .forEach(bloque => {
                const ficha = crearElemento("label", "ficha-bloque");
                const casilla = crearInput("checkbox");
                casilla.value = bloque.id;
                casilla.checked = idsSeleccionados.includes(bloque.id);
                ficha.append(casilla, crearElemento("span", "", `${bloque.inicio}–${bloque.fin}`));
                fichas.append(ficha);
            });

        grupo.append(fichas);
        campo.append(grupo);
    });

    const error = crearElemento("span", "error-campo");
    error.id = `campo-form-${++contadorCamposFormulario}-error`;
    campo.setAttribute("aria-describedby", error.id);
    campo.append(error);
    return campo;
}

// una sesion: dia, bloques y aula, mas el espacio para choques con otras sesiones
function crearFilaSesion(sesion = { dia: "", bloques: [], aula: "" }) {
    const fila = crearElemento("div", "sesion-form");

    const encabezado = crearElemento("div", "sesion-form-encabezado");
    encabezado.append(
        crearElemento("span", "sesion-form-titulo", "Sesión"),
        crearBoton("Quitar sesión", "quitar-sesion", "btn-texto")
    );

    const selectorDia = document.createElement("select");
    selectorDia.append(new Option("Elige un día", ""));
    DIAS_SEMANA.forEach(dia => selectorDia.append(new Option(dia, dia)));
    selectorDia.value = sesion.dia;

    fila.append(
        encabezado,
        crearCampo("Día", selectorDia, "dia"),
        crearCampoBloques(sesion.bloques),
        crearCampo("Aula", crearInput("text", sesion.aula, { placeholder: "Ej: A-11" }), "aula"),
        crearElemento("p", "error-campo error-sesion")
    );
    return fila;
}

// una seccion con sus datos y su lista de sesiones (al menos una fila vacia)
function crearBloqueSeccion(seccion = { id: "", profesor: "", horario: [] }) {
    const bloque = crearElemento("fieldset", "seccion-form");
    bloque.append(crearElemento("legend", "", "Sección"));

    const datos = crearElemento("div", "fila-campos");
    datos.append(
        crearCampo("Identificador", crearInput("text", seccion.id, { placeholder: "Ej: 001" }), "id"),
        crearCampo("Profesor", crearInput("text", seccion.profesor), "profesor")
    );

    const sesiones = crearElemento("div", "sesiones-form");
    const horario = seccion.horario.length > 0 ? seccion.horario : [undefined];
    horario.forEach(sesion => sesiones.append(crearFilaSesion(sesion)));

    const acciones = crearElemento("div", "acciones-seccion");
    acciones.append(
        crearBoton("+ Agregar sesión", "agregar-sesion"),
        crearBoton("Quitar sección", "quitar-seccion", "btn-texto")
    );

    bloque.append(datos, sesiones, crearElemento("p", "error-campo error-horario"), acciones);
    return bloque;
}

// pinta el formulario completo dentro del contenedor indicado
function renderizarFormularioMateria(contenedorId) {
    const caja = document.getElementById(contenedorId);
    if (!caja) return;

    const formulario = crearElemento("form", "form-materia");
    formulario.id = "form-materia";
    // la validacion es propia: se apagan los globos nativos del navegador
    formulario.noValidate = true;

    const titulo = crearElemento("h3", "form-titulo", "Registrar materia manual");
    titulo.id = "titulo-form-materia";
    formulario.setAttribute("aria-labelledby", titulo.id);

    const datosMateria = crearElemento("div", "fila-campos");
    datosMateria.append(
        crearCampo("Código", crearInput("text", "", { placeholder: "Ej: ELE-401", autocomplete: "off" }), "codigo"),
        crearCampo("Nombre", crearInput("text", "", { autocomplete: "off" }), "nombre"),
        crearCampo("Trimestre", crearInput("number", "", { min: "1", step: "1" }), "trimestre"),
        crearCampo("Unidades de crédito", crearInput("number", "", { min: "1", max: "5", step: "1" }), "uc")
    );

    const secciones = crearElemento("div", "secciones-form");
    secciones.append(crearBloqueSeccion());

    const botonGuardar = crearElemento("button", "btn-primario", "Registrar materia");
    botonGuardar.type = "submit";
    botonGuardar.id = "boton-guardar-materia";

    const botonCancelar = crearBoton("Cancelar edición", "cancelar-edicion");
    botonCancelar.id = "boton-cancelar-edicion";
    botonCancelar.hidden = true;

    const acciones = crearElemento("div", "acciones-form");
    acciones.append(botonGuardar, botonCancelar);

    const aviso = crearElemento("p", "aviso");
    aviso.id = "aviso-form-materia";
    aviso.setAttribute("role", "status");
    aviso.hidden = true;

    formulario.append(
        titulo,
        datosMateria,
        crearElemento("h4", "form-subtitulo", "Secciones"),
        secciones,
        crearBoton("+ Agregar sección", "agregar-seccion"),
        crearElemento("p", "error-campo error-secciones"),
        acciones,
        aviso
    );

    formulario.addEventListener("submit", manejarEnvioFormulario);
    formulario.addEventListener("click", manejarClicFormulario);
    formulario.addEventListener("input", limpiarErrorDelCampo);
    formulario.addEventListener("change", limpiarErrorDelCampo);

    caja.replaceChildren(formulario);
    renumerarFormulario();
}

// un solo listener para todos los botones del formulario (delegacion de eventos)
function manejarClicFormulario(evento) {
    const boton = evento.target.closest("button[data-accion]");
    if (!boton) return;

    const formulario = document.getElementById("form-materia");
    const seccion = boton.closest(".seccion-form");

    switch (boton.dataset.accion) {
        case "agregar-seccion": {
            const nueva = crearBloqueSeccion();
            formulario.querySelector(".secciones-form").append(nueva);
            nueva.querySelector("input").focus();
            break;
        }
        case "quitar-seccion":
            seccion.remove();
            formulario.querySelector('[data-accion="agregar-seccion"]').focus();
            break;
        case "agregar-sesion": {
            const nueva = crearFilaSesion();
            seccion.querySelector(".sesiones-form").append(nueva);
            nueva.querySelector("select").focus();
            break;
        }
        case "quitar-sesion":
            boton.closest(".sesion-form").remove();
            seccion.querySelector('[data-accion="agregar-sesion"]').focus();
            break;
        case "cancelar-edicion":
            reiniciarFormulario();
            mostrarAviso("aviso-form-materia", "Edición cancelada. El formulario quedó vacío.", "info");
            break;
    }

    renumerarFormulario();
}

// mantiene "Sección 1", "Sesión 2"... al dia despues de agregar o quitar
function renumerarFormulario() {
    document.querySelectorAll("#form-materia .seccion-form").forEach((seccion, i) => {
        seccion.querySelector("legend").textContent = `Sección ${i + 1}`;
        seccion.querySelectorAll(".sesion-form-titulo").forEach((titulo, j) => {
            titulo.textContent = `Sesión ${j + 1}`;
        });
    });
}

// registra donde se muestra el error de una ruta y que control recibe el foco
function registrarDestinoError(mapa, ruta, campo) {
    mapa[ruta] = {
        campo,
        error: campo.querySelector(":scope > .error-campo"),
        foco: campo.querySelector("input, select")
    };
}

// lee un campo de texto o select y registra su destino de error
function leerCampo(contenedor, nombre, ruta, mapa) {
    const campo = contenedor.querySelector(`[data-campo="${nombre}"]`);
    registrarDestinoError(mapa, ruta, campo);
    return campo.querySelector("input, select").value.trim();
}

// recorre el formulario en orden y devuelve los datos crudos y el mapa ruta -> destino del error
function leerFormulario() {
    const formulario = document.getElementById("form-materia");
    const mapa = {};

    const datos = {
        codigo: leerCampo(formulario, "codigo", "codigo", mapa),
        nombre: leerCampo(formulario, "nombre", "nombre", mapa),
        trimestre: leerCampo(formulario, "trimestre", "trimestre", mapa),
        uc: leerCampo(formulario, "uc", "uc", mapa),
        secciones: []
    };

    mapa.secciones = {
        campo: null,
        error: formulario.querySelector(".error-secciones"),
        foco: formulario.querySelector('[data-accion="agregar-seccion"]')
    };

    formulario.querySelectorAll(".secciones-form > .seccion-form").forEach((seccionEl, i) => {
        const ruta = `secciones.${i}`;
        const seccion = {
            id: leerCampo(seccionEl, "id", `${ruta}.id`, mapa),
            profesor: leerCampo(seccionEl, "profesor", `${ruta}.profesor`, mapa),
            horario: []
        };

        mapa[`${ruta}.horario`] = {
            campo: null,
            error: seccionEl.querySelector(":scope > .error-horario"),
            foco: seccionEl.querySelector('[data-accion="agregar-sesion"]')
        };

        seccionEl.querySelectorAll(".sesion-form").forEach((sesionEl, j) => {
            const rutaSesion = `${ruta}.horario.${j}`;
            const dia = leerCampo(sesionEl, "dia", `${rutaSesion}.dia`, mapa);

            const campoBloques = sesionEl.querySelector('[data-campo="bloques"]');
            registrarDestinoError(mapa, `${rutaSesion}.bloques`, campoBloques);
            const bloques = [...campoBloques.querySelectorAll("input:checked")].map(c => c.value);

            const aula = leerCampo(sesionEl, "aula", `${rutaSesion}.aula`, mapa);

            mapa[rutaSesion] = {
                campo: null,
                error: sesionEl.querySelector(":scope > .error-sesion"),
                foco: campoBloques.querySelector("input")
            };

            seccion.horario.push({ dia, bloques, aula });
        });

        datos.secciones.push(seccion);
    });

    return { datos, mapa };
}

function limpiarErroresFormulario() {
    const formulario = document.getElementById("form-materia");
    formulario.querySelectorAll(".error-campo").forEach(error => { error.textContent = ""; });
    formulario.querySelectorAll(".campo-invalido").forEach(campo => campo.classList.remove("campo-invalido"));
    formulario.querySelectorAll("[aria-invalid]").forEach(control => control.removeAttribute("aria-invalid"));
}

// escribe cada error junto a su control y devuelve el primer control a enfocar
// se recorre el mapa y no los errores para respetar el orden visual del formulario
function mostrarErroresFormulario(errores, mapa) {
    let primerFoco = null;

    Object.entries(mapa).forEach(([ruta, destino]) => {
        const mensaje = errores[ruta];
        if (!mensaje) return;

        destino.error.textContent = mensaje;
        if (destino.campo) {
            destino.campo.classList.add("campo-invalido");
            if (destino.foco && destino.foco.type !== "checkbox") {
                destino.foco.setAttribute("aria-invalid", "true");
            }
        }
        if (!primerFoco) primerFoco = destino.foco;
    });

    return primerFoco;
}

// el error de un campo desaparece apenas el usuario lo modifica
function limpiarErrorDelCampo(evento) {
    const campo = evento.target.closest(".campo-form");
    if (!campo) return;

    campo.classList.remove("campo-invalido");
    evento.target.removeAttribute("aria-invalid");
    campo.querySelector(":scope > .error-campo").textContent = "";

    // cambiar dia o bloques puede resolver un choque entre sesiones
    const sesion = evento.target.closest(".sesion-form");
    if (sesion && (campo.dataset.campo === "dia" || campo.dataset.campo === "bloques")) {
        sesion.querySelector(":scope > .error-sesion").textContent = "";
    }
}

// convierte los datos crudos en una materia con la misma forma que las del catalogo
function construirMateriaManual(datos) {
    return {
        codigo: datos.codigo.toUpperCase(),
        nombre: datos.nombre,
        trimestre: Number(datos.trimestre),
        uc: Number(datos.uc),
        secciones: datos.secciones.map(seccion => ({
            id: seccion.id,
            profesor: seccion.profesor,
            horario: seccion.horario.map(sesion => ({
                dia: sesion.dia,
                bloques: ordenarIdsBloquesPorInicio(sesion.bloques),
                aula: sesion.aula
            }))
        }))
    };
}

function manejarEnvioFormulario(evento) {
    evento.preventDefault();

    const { datos, mapa } = leerFormulario();
    const errores = validarMateriaManual(datos, codigoEnEdicion);

    limpiarErroresFormulario();
    if (Object.keys(errores).length > 0) {
        const primerFoco = mostrarErroresFormulario(errores, mapa);
        mostrarAviso("aviso-form-materia", "Revisa los campos marcados antes de guardar.", "error");
        if (primerFoco) primerFoco.focus();
        return;
    }

    const materia = construirMateriaManual(datos);
    agregarMateriaManual(materia);

    reiniciarFormulario();
    refrescarCatalogo();
    mostrarAviso("aviso-form-materia", `La materia ${materia.codigo} se agregó al catálogo.`, "exito");
}

// vuelve el formulario a su estado inicial: vacio, con una seccion y en modo registro
function reiniciarFormulario() {
    const formulario = document.getElementById("form-materia");
    codigoEnEdicion = null;
    formulario.reset();
    formulario.querySelector(".secciones-form").replaceChildren(crearBloqueSeccion());
    limpiarErroresFormulario();
    actualizarModoFormulario();
    renumerarFormulario();
}

// ajusta titulo y botones segun se este registrando o editando
function actualizarModoFormulario() {
    const editando = codigoEnEdicion !== null;
    document.getElementById("titulo-form-materia").textContent =
        editando ? `Editar materia ${codigoEnEdicion}` : "Registrar materia manual";
    document.getElementById("boton-guardar-materia").textContent =
        editando ? "Guardar cambios" : "Registrar materia";
    document.getElementById("boton-cancelar-edicion").hidden = !editando;
}
