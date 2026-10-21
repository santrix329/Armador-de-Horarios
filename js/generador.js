/* 
 * aqui armo la logica para combinar las materias y generar los horarios validos
 */

// aqui preparo el generador principal de horarios
function generarHorarios() {
    let seleccion = materiasSeleccionadas;
    if (!seleccion || seleccion.length === 0) {
        return [];
    }

    let horariosValidos = [];

    // aqui recorro las materias seleccionadas para empezar a combinar secciones
    // por ahora dejamos la estructura lista para implementar la recursion o bucles de combinacion
    console.log("Iniciando generacion de horarios para", seleccion.length, "materias...");

    return horariosValidos;
}

// aqui filtro las secciones tomando en cuenta las fijadas o excluidas por el usuario
function filtrarSeccionesDisponibles(materia) {
    let seccionesValidas = [];
    let secciones = materia.secciones;

    if (!secciones) return seccionesValidas;

    for (let i = 0; i < secciones.length; i++) {
        let sec = secciones[i];

        // si la seccion esta excluida la salto
        if (materia.seccionesExcluidas && materia.seccionesExcluidas.includes(sec.id)) {
            continue;
        }

        // si hay secciones fijadas y esta no es una de ellas, la salto tambien
        if (materia.seccionesFijadas && materia.seccionesFijadas.length > 0) {
            if (!materia.seccionesFijadas.includes(sec.id)) {
                continue;
            }
        }

        seccionesValidas.push(sec);
    }

    return seccionesValidas;
}