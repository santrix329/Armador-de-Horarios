/* 
 * aqui armo la logica para combinar las materias y generar los horarios validos con trazas de depuracion
 */

// aqui preparo el generador principal de horarios
function generarHorarios() {
    let seleccion = materiasSeleccionadas;
    console.log("1. Materias seleccionadas recibidas:", seleccion);

    if (!seleccion || seleccion.length === 0) {
        console.log("-> Alerta: No hay materias seleccionadas.");
        return [];
    }

    let horariosValidos = [];
    let materiasConSecciones = [];

    // aqui preparo las listas de secciones validas para cada materia seleccionada
    for (let i = 0; i < seleccion.length; i++) {
        let mat = seleccion[i];
        let seccionesValidas = filtrarSeccionesDisponibles(mat);
        console.log(`2. Materia ${mat.codigo} (${mat.nombre}) tiene ${seccionesValidas.length} secciones válidas.`);

        if (seccionesValidas.length === 0) {
            console.log(`-> Alerta: La materia ${mat.codigo} se quedó sin secciones válidas.`);
            return [];
        }

        materiasConSecciones.push({
            materia: mat,
            secciones: seccionesValidas
        });
    }

    console.log("3. Iniciando exploración recursiva con", materiasConSecciones.length, "materias...");
    explorarCombinaciones(0, materiasConSecciones, [], horariosValidos);

    console.log("4. Generación completa. Horarios válidos totales encontrados:", horariosValidos.length);
    return horariosValidos;
}

// aqui filtro las secciones tomando en cuenta las fijadas o excluidas por el usuario
function filtrarSeccionesDisponibles(materia) {
    let seccionesValidas = [];
    let secciones = materia.secciones;

    if (!secciones) return seccionesValidas;

    for (let i = 0; i < secciones.length; i++) {
        let sec = secciones[i];

        if (materia.seccionesExcluidas && materia.seccionesExcluidas.includes(sec.id)) {
            continue;
        }

        if (materia.seccionesFijadas && materia.seccionesFijadas.length > 0) {
            if (!materia.seccionesFijadas.includes(sec.id)) {
                continue;
            }
        }

        seccionesValidas.push(sec);
    }

    return seccionesValidas;
}

// aqui recorro las materias paso a paso probando secciones con trazas
function explorarCombinaciones(indiceMateria, materiasConSecciones, combinacionActual, horariosValidos) {
    // caso base: si ya llenamos todas las materias, guardamos el horario completo
    if (indiceMateria === materiasConSecciones.length) {
        console.log("-> ¡ÉXITO! Horario completo encontrado:", [...combinacionActual]);
        horariosValidos.push([...combinacionActual]);
        return;
    }

    let actual = materiasConSecciones[indiceMateria];
    let secciones = actual.secciones;

    console.log(`-> Explorando índice ${indiceMateria}: Materia ${actual.materia.codigo}, probando ${secciones.length} secciones.`);

    for (let i = 0; i < secciones.length; i++) {
        let seccionPrueba = secciones[i];

        // descarte temprano: si choca con lo que ya llevamos, la saltamos
        if (tieneChoqueConSeleccion(seccionPrueba, combinacionActual)) {
            console.log(`   [X] Sección ${seccionPrueba.id} de ${actual.materia.codigo} choca con la selección actual.`);
            continue;
        }

        console.log(`   [OK] Sección ${seccionPrueba.id} de ${actual.materia.codigo} es compatible. Agregando...`);

        // agregamos la seccion temporalmente
        combinacionActual.push({
            materia: actual.materia,
            seccion: seccionPrueba
        });

        // avanzamos a la siguiente materia
        explorarCombinaciones(indiceMateria + 1, materiasConSecciones, combinacionActual, horariosValidos);

        // backtracking: sacamos la ultima para probar con la siguiente opcion
        combinacionActual.pop();
    }
}

// funcion auxiliar para verificar si una seccion choca con las que ya elegimos
function tieneChoqueConSeleccion(seccionNueva, combinacionActual) {
    for (let j = 0; j < combinacionActual.length; j++) {
        let seccionYaElegida = combinacionActual[j].seccion;

        if (seccionesChocanCompletas(seccionYaElegida, seccionNueva)) {
            return true;
        }
    }
    return false;
}