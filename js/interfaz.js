/*
 * utilidades de interfaz compartidas por todas las vistas
 * crean nodos con createElement y muestran avisos dentro del dom, nunca con alert()
 */

// temporizadores de los avisos por id, para que un aviso nuevo no se borre antes de tiempo
const temporizadoresAvisos = {};

// crea un elemento con clase y texto opcionales; el texto se asigna con textContent
function crearElemento(etiqueta, clase = "", texto = "") {
    const elemento = document.createElement(etiqueta);
    if (clase) elemento.className = clase;
    if (texto) elemento.textContent = texto;
    return elemento;
}

// crea un boton que no envia formularios; accion queda en data-accion para la delegacion de eventos
function crearBoton(texto, accion, clase = "btn-secundario") {
    const boton = crearElemento("button", clase, texto);
    boton.type = "button";
    if (accion) boton.dataset.accion = accion;
    return boton;
}

// muestra un aviso en el elemento indicado; los de error se quedan hasta el siguiente aviso
// tipo: "exito", "error" o "info"
function mostrarAviso(idAviso, mensaje, tipo = "info") {
    const aviso = document.getElementById(idAviso);
    if (!aviso) return;

    aviso.textContent = mensaje;
    aviso.className = `aviso aviso-${tipo}`;
    aviso.hidden = false;

    clearTimeout(temporizadoresAvisos[idAviso]);
    if (tipo !== "error") {
        temporizadoresAvisos[idAviso] = setTimeout(() => {
            aviso.hidden = true;
        }, 4000);
    }
}

// oculta un aviso sin esperar al temporizador
function ocultarAviso(idAviso) {
    const aviso = document.getElementById(idAviso);
    if (!aviso) return;
    clearTimeout(temporizadoresAvisos[idAviso]);
    aviso.hidden = true;
}
