/* 
 * Aqui manejo toda la logica para detectar choques de horario 
 * y materias incompatibles reutilizando las funciones de tiempo.js
 */

// Aqui obtengo la hora de inicio y fin en formato de texto (HH:MM) de una sesion buscando sus bloques
function obtenerHorarioSesionEnTexto(sesion) {
    const bloquesSesion = sesion.bloques;
    if (!bloquesSesion || bloquesSesion.length === 0) return { inicio: "", fin: "" };

    const primerBloqueId = bloquesSesion[0];
    const ultimoBloqueId = bloquesSesion[bloquesSesion.length - 1];

    const bloqueInicio = BLOQUES.find(b => b.id === primerBloqueId);
    const bloqueFin = BLOQUES.find(b => b.id === ultimoBloqueId);

    if (!bloqueInicio || !bloqueFin) return { inicio: "", fin: "" };

    return {
        inicio: bloqueInicio.inicio,
        fin: bloqueFin.fin
    };
}

// Aqui compruebo si dos sesiones chocan reutilizando seSolapanIntervalos de tiempo.js
function sesionesChocan(sesionA, sesionB) {
    // Si ocurren en dias diferentes no chocan de ninguna manera
    if (sesionA.dia !== sesionB.dia) {
        return false;
    }

    const horarioA = obtenerHorarioSesionEnTexto(sesionA);
    const horarioB = obtenerHorarioSesionEnTexto(sesionB);

    // Reutilizamos directamente la funcion global que creamos en tiempo.js
    return seSolapanIntervalos(horarioA.inicio, horarioA.fin, horarioB.inicio, horarioB.fin);
}