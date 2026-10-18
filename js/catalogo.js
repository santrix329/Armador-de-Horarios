/*
 * Gestiona la visualización, filtros y vista de detalle del catálogo de materias.
 */

// Renderiza la lista de materias en el contenedor html indicado
function renderizarCatalogo(contenedorId, materias = obtenerTodasLasMaterias()) {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return;

    contenedor.innerHTML = "";

    if (materias.length === 0) {
        contenedor.innerHTML = `<div class="estado-vacio">No se encontraron materias que coincdan con los filtros</div>`;
        return;
    }

    materias.forEach(materia => {
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-materia";
        
        // Aqui se inidica si es manual o del catalogo oficial para la marca visual
        const esManual = obtenerMateriasManuales().some(m => m.codigo === materia.codigo);
        if (esManual) {
            tarjeta.classList.add("materia-manual");
        }

        tarjeta.innerHTML = `
            <div class="materia-header">
                <div>
                    <span class="materia-codigo">${materia.codigo}</span>
                    <span class="badge-tipo">${esManual ? "Manual" : "Oficial"}</span>
                </div>
                <span class="materia-uc">${materia.uc} UC</span>
            </div>
            <h3 class="materia-nombre">${materia.nombre}</h3>
            <p class="materia-trimestre">Trimestre: ${materia.trimestre} | Secciones: ${materia.secciones.length}</p>
            <button class="btn-detalles" onclick="toggleDetallesMateria('${materia.codigo}')">Ver Secciones</button>
            <div id="detalles-${materia.codigo}" class="materia-detalles oculto">
                <h4>Secciones Disponibles:</h4>
                <ul>
                    ${materia.secciones.map(sec => `
                        <li>
                            <strong>Sección ${sec.id}</strong> -${sec.profesor}
                            <ul>
                                ${sec.horario.map(sesion => `
                                    <li>${sesion.dia}: ${sesion.bloques.join(", ")} (Aula: ${sesion.aula})</li>
                                `).join("")}
                            </ul>
                        </li>
                    `).join("")}
                </ul>
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}

// Filtra el catálogo según el trimestre seleccionado y el texto de búsqueda
function filtrarCatalogo(busqueda = "", trimestreFiltro = "todos") {
    const todas = obtenerTodasLasMaterias();

    const filtradas = todas.filter(materia => {
        const coincideTexto = materia.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                              materia.codigo.toLowerCase().includes(busqueda.toLowerCase());
        
        const coincideTrimestre = trimestreFiltro === "todos" || materia.trimestre.toString() === trimestreFiltro.toString();

        return coincideTexto && coincideTrimestre;
    });

    renderizarCatalogo("contenedor-catalogo", filtradas);
}

// Muestra u oculta el detalle de las secciones de una materia
function toggleDetallesMateria(codigo) {
    const elDetalle = document.getElementById(`detalles-${codigo}`);
    if (elDetalle) {
        elDetalle.classList.toggle("oculto");
    }
}