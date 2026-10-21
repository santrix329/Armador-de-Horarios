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
                htmlHorarios += `<li>${sesion.dia}: ${horas.inicio} - ${horas.fin} (Aula: ${sesion.aula})</li>`;
            });

            htmlSecciones += `
                <li>
                    <strong>Sección ${sec.id}</strong> - ${sec.profesor}
                    <ul>${htmlHorarios}</ul>
                </li>
            `;
        });

        tarjeta.innerHTML = `
            <div class="materia-header">
                <div>
                    <span class="materia-codigo">${materia.codigo}</span>
                    <span class="badge-tipo">${esUnaMateriaManual ? "Manual" : "Oficial"}</span>
                </div>
                <span class="materia-uc">${materia.uc} UC</span>
            </div>
            <h3 class="materia-nombre">${materia.nombre}</h3>
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

// Para abrir o cerrar los detalles de la materia cuando le dan al boton
function toggleDetallesMateria(codigoMateria) {
    const elDetalle = document.getElementById(`detalles-${codigoMateria}`);
    if (elDetalle) {
        elDetalle.classList.toggle("oculto");
    }
}