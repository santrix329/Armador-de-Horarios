/* 
 * Aqui manejo todo lo relacionado con mostrar las materias, 
 * los filtros y la vista de los detalles de cada una
 */

// Funcion para pintar la materias en el html
function renderizarCatalogo(contenedorId, listaMaterias = obtenerTodasLasMaterias()) {
    
    const caja = document.getElementById(contenedorId);
    if (!caja) {
        return; // Si no existe el contenedor nos salimos para que no de error
    }

    // Limpiamos la caja antes de dibujar para que no se repita todo
    caja.innerHTML = "";

    // Si la lista viene vacia mostramos un aviso
    if (listaMaterias.length === 0) {
        caja.innerHTML = `<div class="estado-vacio">No se encontraron materias que coincidan con los filtros</div>`;
        return;
    }

    // Recorremos la lista de materias una por una con el forEach
    listaMaterias.forEach(materia => {
        
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-materia";
        
        // Verificamos si la materia es creada a mano por el usuario
        const manuales = obtenerMateriasManuales();
        let esUnaMateriaManual = false;
        
        for (let i = 0; i < manuales.length; i++) {
            if (manuales[i].codigo === materia.codigo) {
                esUnaMateriaManual = true;
            }
        }

        if (esUnaMateriaManual) {
            tarjeta.classList.add("materia-manual");
        }

        // Armamos el HTML interno de la tarjeta
        let htmlSecciones = "";
        materia.secciones.forEach(sec => {
            let htmlHorarios = "";
            sec.horario.forEach(sesion => {
                // Se muestran horas legibles, nunca los identificadores de bloque
                const horas = obtenerHorarioSesionEnTexto(sesion);
                htmlHorarios += `<li>${escaparHtml(sesion.dia)}: ${horas.inicio} - ${horas.fin} (Aula: ${escaparHtml(sesion.aula)})</li>`;
            });

            // los textos se escapan porque las materias manuales los escribe el usuario
            htmlSecciones += `
                <li>
                    <strong>Sección ${escaparHtml(sec.id)}</strong> - ${escaparHtml(sec.profesor)}
                    <ul>${htmlHorarios}</ul>
                </li>
            `;
        });

        tarjeta.innerHTML = `
            <div class="materia-header">
                <div>
                    <span class="materia-codigo">${escaparHtml(materia.codigo)}</span>
                    <span class="badge-tipo">${esUnaMateriaManual ? "Manual" : "Oficial"}</span>
                </div>
                <span class="materia-uc">${materia.uc} UC</span>
            </div>
            <h3 class="materia-nombre">${escaparHtml(materia.nombre)}</h3>
            <p class="materia-trimestre">Trimestre: ${materia.trimestre} | Secciones: ${materia.secciones.length}</p>
        `;

        // El boton se crea con createElement para registrar el evento con addEventListener
        const botonDetalles = document.createElement("button");
        botonDetalles.className = "btn-detalles";
        botonDetalles.textContent = "Ver Secciones";
        botonDetalles.addEventListener("click", () => toggleDetallesMateria(materia.codigo));

        const detalles = document.createElement("div");
        detalles.id = `detalles-${materia.codigo}`;
        detalles.className = "materia-detalles oculto";
        detalles.innerHTML = `
            <h4>Secciones Disponibles:</h4>
            <ul>
                ${htmlSecciones}
            </ul>
        `;

        tarjeta.appendChild(botonDetalles);

        // el texto y el estado del boton los decide vistaSeleccion.js segun la seleccion actual
        const botonAgregar = crearBoton("Agregar", "agregar-materia", "btn-primario");
        botonAgregar.dataset.codigo = materia.codigo;
        actualizarBotonAgregar(botonAgregar);
        botonAgregar.addEventListener("click", () => manejarAgregarMateria(materia.codigo));
        tarjeta.appendChild(botonAgregar);

        // solo las materias manuales se pueden editar o eliminar
        if (esUnaMateriaManual) {
            tarjeta.appendChild(crearAccionesMateriaManual(materia.codigo));
        }
        tarjeta.appendChild(detalles);
        caja.appendChild(tarjeta);
    });
}

// Funcion para filtrar por texto o por trimestre
function filtrarCatalogo(busqueda = "", trimestreFiltro = "todos") {
    const todasLasMaterias = obtenerTodasLasMaterias();

    const materiasFiltradas = todasLasMaterias.filter(materia => {
        const textoBusqueda = busqueda.toLowerCase();
        const coincideNombre = materia.nombre.toLowerCase().includes(textoBusqueda);
        const coincideCodigo = materia.codigo.toLowerCase().includes(textoBusqueda);
        
        const pasaTexto = coincideNombre || coincideCodigo;
        
        let pasaTrimestre = false;
        if (trimestreFiltro === "todos") {
            pasaTrimestre = true;
        } else {
            pasaTrimestre = materia.trimestre.toString() === trimestreFiltro.toString();
        }

        return pasaTexto && pasaTrimestre;
    });

    renderizarCatalogo("contenedor-catalogo", materiasFiltradas);
}

// Retorna los trimestres presentes en las materias, ordenados y sin repetir
function obtenerTrimestresDisponibles() {
    const trimestres = obtenerTodasLasMaterias().map(m => m.trimestre);
    return [...new Set(trimestres)].sort((a, b) => a - b);
}

// Lee los controles del catalogo y vuelve a pintar las materias filtradas
function aplicarFiltrosCatalogo() {
    const buscador = document.getElementById("buscador-catalogo");
    const selector = document.getElementById("filtro-trimestre");
    const busqueda = buscador ? buscador.value.trim() : "";
    const trimestre = selector ? selector.value : "todos";
    filtrarCatalogo(busqueda, trimestre);
}

// Crea el buscador y el filtro por trimestre; las opciones salen de los datos
function renderizarControlesCatalogo(contenedorId) {
    const caja = document.getElementById(contenedorId);
    if (!caja) {
        return;
    }

    caja.innerHTML = "";

    const etiquetaBuscador = document.createElement("label");
    etiquetaBuscador.htmlFor = "buscador-catalogo";
    etiquetaBuscador.textContent = "Buscar por nombre o código";

    const buscador = document.createElement("input");
    buscador.type = "search";
    buscador.id = "buscador-catalogo";
    buscador.placeholder = "Ej: Cálculo o MAT-101";
    buscador.addEventListener("input", aplicarFiltrosCatalogo);

    const etiquetaTrimestre = document.createElement("label");
    etiquetaTrimestre.htmlFor = "filtro-trimestre";
    etiquetaTrimestre.textContent = "Trimestre";

    const selector = document.createElement("select");
    selector.id = "filtro-trimestre";

    const opcionTodos = document.createElement("option");
    opcionTodos.value = "todos";
    opcionTodos.textContent = "Todos";
    selector.appendChild(opcionTodos);

    obtenerTrimestresDisponibles().forEach(trimestre => {
        const opcion = document.createElement("option");
        opcion.value = String(trimestre);
        opcion.textContent = `Trimestre ${trimestre}`;
        selector.appendChild(opcion);
    });

    selector.addEventListener("change", aplicarFiltrosCatalogo);

    caja.appendChild(etiquetaBuscador);
    caja.appendChild(buscador);
    caja.appendChild(etiquetaTrimestre);
    caja.appendChild(selector);
}

// vuelve a pintar el catalogo despues de registrar, editar o eliminar una materia manual;
// regenera las opciones de trimestre por si aparecio o desaparecio alguno, sin perder el filtro elegido
function refrescarCatalogo() {
    const selector = document.getElementById("filtro-trimestre");
    if (selector) {
        const elegido = selector.value;
        const trimestres = obtenerTrimestresDisponibles().map(String);
        const opciones = [new Option("Todos", "todos"), ...trimestres.map(t => new Option(`Trimestre ${t}`, t))];
        selector.replaceChildren(...opciones);
        selector.value = trimestres.includes(elegido) ? elegido : "todos";
    }
    aplicarFiltrosCatalogo();
}

// Para abrir o cerrar los detalles de la materia cuando le dan al boton
function toggleDetallesMateria(codigoMateria) {
    const elDetalle = document.getElementById(`detalles-${codigoMateria}`);
    if (elDetalle) {
        elDetalle.classList.toggle("oculto");
    }
}