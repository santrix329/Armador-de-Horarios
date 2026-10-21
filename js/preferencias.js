/*
 * filtros de preferencias sobre los horarios generados
 * trabajan sobre la lista que devuelve generarHorarios ([{ materia, seccion }, ...]) y no tocan el dom
 */

// filtros activos; una lista vacia o una hora vacia significa que ese filtro no se aplica
let preferenciasActivas = {
    diasLibres: [],
    horaMinEntrada: "",
    horaMaxSalida: ""
};

function obtenerPreferencias() {
    return preferenciasActivas;
}

// actualiza uno o varios filtros; rechaza combinaciones imposibles sin tocar los activos
function actualizarPreferencias(cambios) {
    const nuevas = { ...preferenciasActivas, ...cambios };

    if (nuevas.horaMinEntrada && nuevas.horaMaxSalida &&
        convertirHoraAMinutos(nuevas.horaMinEntrada) >= convertirHoraAMinutos(nuevas.horaMaxSalida)) {
        return { exito: false, mensaje: "La hora mínima de entrada debe ser anterior a la hora máxima de salida." };
    }

    nuevas.diasLibres = nuevas.diasLibres.filter(dia => DIAS_SEMANA.includes(dia));
    preferenciasActivas = nuevas;
    return { exito: true, mensaje: "" };
}

function reiniciarPreferencias() {
    preferenciasActivas = { diasLibres: [], horaMinEntrada: "", horaMaxSalida: "" };
}

// horas que tiene sentido ofrecer en los filtros: salen de BLOQUES, no se escriben a mano
function obtenerHorasDeEntrada() {
    return ordenarHorasUnicas(BLOQUES.map(b => b.inicio));
}

function obtenerHorasDeSalida() {
    return ordenarHorasUnicas(BLOQUES.map(b => b.fin));
}

function ordenarHorasUnicas(horas) {
    return [...new Set(horas)].sort((a, b) => convertirHoraAMinutos(a) - convertirHoraAMinutos(b));
}

// todas las sesiones de un horario con su dia, inicio y fin en minutos
function obtenerSesionesDeHorario(horario) {
    const sesiones = [];
    horario.forEach(({ seccion }) => {
        seccion.horario.forEach(sesion => {
            const horas = obtenerHorarioSesionEnTexto(sesion);
            sesiones.push({
                dia: sesion.dia,
                inicio: convertirHoraAMinutos(horas.inicio),
                fin: convertirHoraAMinutos(horas.fin)
            });
        });
    });
    return sesiones;
}

// un horario cumple si ninguna de sus sesiones cae en un dia libre,
// empieza antes de la entrada minima o termina despues de la salida maxima
function cumplePreferencias(horario, preferencias = preferenciasActivas) {
    const minEntrada = preferencias.horaMinEntrada ? convertirHoraAMinutos(preferencias.horaMinEntrada) : null;
    const maxSalida = preferencias.horaMaxSalida ? convertirHoraAMinutos(preferencias.horaMaxSalida) : null;

    return obtenerSesionesDeHorario(horario).every(sesion =>
        !preferencias.diasLibres.includes(sesion.dia) &&
        (minEntrada === null || sesion.inicio >= minEntrada) &&
        (maxSalida === null || sesion.fin <= maxSalida)
    );
}

// devuelve solo los horarios que cumplen los filtros; no modifica la lista original
function filtrarHorarios(horarios, preferencias = preferenciasActivas) {
    return horarios.filter(horario => cumplePreferencias(horario, preferencias));
}
