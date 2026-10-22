console.log("Aplicación iniciada con exito");
console.log("Bloques cargados:", BLOQUES.length);
console.log("Materias cargadas:", MATERIAS.length);

// Punto de entrada: pinta los controles y el catalogo completo al cargar la pagina
function iniciarAplicacion() {
    renderizarControlesCatalogo("controles-catalogo");
    renderizarCatalogo("contenedor-catalogo");
    renderizarFormularioMateria("contenedor-formulario");
    iniciarPanelSeleccion();
    iniciarResultados();

    // El aviso de carga ya no es necesario una vez pintado el catalogo
    const avisoCarga = document.querySelector(".welcome-section");
    if (avisoCarga) {
        avisoCarga.remove();
    }
}

iniciarAplicacion();
