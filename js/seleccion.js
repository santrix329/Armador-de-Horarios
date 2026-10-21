/* 
 * Aqui manejo la base de las materias seleccionadas y el control de UC
 */

// Aca guardo en memoria la lista de materias que el usuario va seleccionando
let materiasSeleccionadas = [];

// Aca configuro el tope maximo de unidades de credito por defecto
let topeUcMaximo = 28;

// Funcion para obtener las materias que ya fueron seleccionadas
function obtenerMateriasSeleccionadas() {
    return materiasSeleccionadas;
}

// Funcion para obtener el tope actual de UC
function obtenerTopeUc() {
    return topeUcMaximo;
}

// Funcion para cambiar el tope de UC si el usuario lo ajusta
function cambiarTopeUc(nuevoTope) {
    const tope = Number(nuevoTope);

    // El tope debe ser un numero entero positivo
    if (!Number.isInteger(tope) || tope <= 0) {
        return { exito: false, mensaje: "El tope de UC debe ser un número entero positivo" };
    }

    const ucActuales = calcularTotalUc();
    if (tope < ucActuales) {
        return { exito: false, mensaje: `El tope no puede ser menor a las ${ucActuales} UC ya seleccionadas` };
    }

    topeUcMaximo = tope;
    return { exito: true, mensaje: `Tope de UC actualizado a ${tope}` };
}

// Funcion para calcular cuantas UC lleva acumuladas el usuario
function calcularTotalUc() {
    let total = 0;
    for (let i = 0; i < materiasSeleccionadas.length; i++) {
        total += materiasSeleccionadas[i].uc;
    }
    return total;
}

// Funcion para agregar una materia a la seleccion validando el tope de UC
function agregarMateriaSeleccionada(codigoMateria) {
    let materiaAAgregar = obtenerTodasLasMaterias().find(m => m.codigo === codigoMateria);
    
    if (!materiaAAgregar) {
        materiaAAgregar = obtenerMateriasManuales().find(m => m.codigo === codigoMateria);
    }

    if (!materiaAAgregar) {
        return { exito: false, mensaje: "La materia no existe" };
    }

    const yaExiste = materiasSeleccionadas.some(m => m.codigo === codigoMateria);
    if (yaExiste) {
        return { exito: false, mensaje: "La materia ya esta seleccionada" };
    }

    const ucProyectadas = calcularTotalUc() + materiaAAgregar.uc;
    if (ucProyectadas > topeUcMaximo) {
        return { exito: false, mensaje: `Supera el tope de ${topeUcMaximo} UC` };
    }

    materiasSeleccionadas.push({
        ...materiaAAgregar,
        seccionesFijadas: [],
        seccionesExcluidas: []
    });

    return { exito: true, mensaje: "Materia agregada con exito" };
}

// Funcion para quitar una materia de la seleccion
function quitarMateriaSeleccionada(codigoMateria) {
    materiasSeleccionadas = materiasSeleccionadas.filter(m => m.codigo !== codigoMateria);
}

// total de uc que quedaria si una materia ya seleccionada pasara a tener ucNuevas
function calcularUcConCambio(codigoMateria, ucNuevas) {
    const materia = materiasSeleccionadas.find(m => m.codigo === codigoMateria);
    if (!materia) return calcularTotalUc();
    return calcularTotalUc() - materia.uc + ucNuevas;
}

// al editar una materia manual que esta seleccionada, reemplaza su copia en la seleccion;
// conserva las secciones fijadas y excluidas que sigan existiendo
function actualizarMateriaSeleccionada(codigoOriginal, materiaNueva) {
    const indice = materiasSeleccionadas.findIndex(m => m.codigo === codigoOriginal);
    if (indice === -1) return;

    const anterior = materiasSeleccionadas[indice];
    const idsNuevos = materiaNueva.secciones.map(s => s.id);
    let excluidas = anterior.seccionesExcluidas.filter(id => idsNuevos.includes(id));

    // si las exclusiones dejaran a la materia sin secciones, se descartan
    if (excluidas.length >= idsNuevos.length) {
        excluidas = [];
    }

    materiasSeleccionadas[indice] = {
        ...materiaNueva,
        seccionesFijadas: anterior.seccionesFijadas.filter(id => idsNuevos.includes(id)),
        seccionesExcluidas: excluidas
    };
}

// Funcion para el atajo de agregar todo un trimestre completo
function agregarTrimestreCompleto(numeroTrimestre) {
    // obtenerTodasLasMaterias ya incluye las materias manuales
    const materiasTrimestre = obtenerTodasLasMaterias().filter(m => m.trimestre === Number(numeroTrimestre));

    let ucNuevas = 0;
    const aAgregar = [];

    for (let i = 0; i < materiasTrimestre.length; i++) {
        const mat = materiasTrimestre[i];
        const yaSeleccionada = materiasSeleccionadas.some(m => m.codigo === mat.codigo);
        if (!yaSeleccionada) {
            aAgregar.push(mat);
            ucNuevas += mat.uc;
        }
    }

    const exceso = calcularTotalUc() + ucNuevas - topeUcMaximo;
    if (exceso > 0) {
        return {
            exito: false,
            mensaje: `El trimestre excede en ${exceso} UC el tope permitido (${topeUcMaximo} UC)`
        };
    }

    for (let j = 0; j < aAgregar.length; j++) {
        agregarMateriaSeleccionada(aAgregar[j].codigo);
    }

    return { exito: true, mensaje: `Trimestre ${numeroTrimestre} agregado correctamente` };
}

// Retorna las secciones que se consideran para una materia seleccionada:
// si hay secciones fijadas solo esas; si no, todas menos las excluidas
function obtenerSeccionesDisponibles(materia) {
    if (materia.seccionesFijadas && materia.seccionesFijadas.length > 0) {
        return materia.secciones.filter(sec => materia.seccionesFijadas.includes(sec.id));
    }
    const excluidas = materia.seccionesExcluidas || [];
    return materia.secciones.filter(sec => !excluidas.includes(sec.id));
}

// Funcion para fijar una seccion especifica de una materia seleccionada
function fijarSeccion(codigoMateria, idSeccion) {
    const materia = materiasSeleccionadas.find(m => m.codigo === codigoMateria);
    if (!materia) return;

    materia.seccionesExcluidas = materia.seccionesExcluidas.filter(id => id !== idSeccion);

    if (!materia.seccionesFijadas.includes(idSeccion)) {
        materia.seccionesFijadas.push(idSeccion);
    }
}

// Funcion para excluir una seccion especifica
function excluirSeccion(codigoMateria, idSeccion) {
    const materia = materiasSeleccionadas.find(m => m.codigo === codigoMateria);
    if (!materia) return;

    if (materia.seccionesExcluidas.length + 1 >= materia.secciones.length) {
        console.warn("No puedes excluir todas las secciones de la materia");
        return;
    }

    materia.seccionesFijadas = materia.seccionesFijadas.filter(id => id !== idSeccion);

    if (!materia.seccionesExcluidas.includes(idSeccion)) {
        materia.seccionesExcluidas.push(idSeccion);
    }
}