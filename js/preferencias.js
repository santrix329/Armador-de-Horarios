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

/*
 * metricas y ordenamiento de resultados
 */

// criterios de ordenamiento disponibles; "" conserva el orden en que se generaron
const CRITERIOS_ORDEN = {
    "": "Orden de generación",
    dias: "Menos días de asistencia",
    "horas-muertas": "Menos horas muertas",
    salida: "Salida más temprana"
};

let criterioOrdenActivo = "";

function obtenerCriterioOrden() {
    return criterioOrdenActivo;
}

function cambiarCriterioOrden(criterio) {
    if (criterio in CRITERIOS_ORDEN) {
        criterioOrdenActivo = criterio;
    }
}

// metricas de un horario, todas en minutos salvo los dias:
// - diasAsistencia: dias distintos con al menos una sesion
// - minutosMuertos: suma de los huecos entre el fin de una sesion y el inicio de la siguiente el mismo dia
// - salidaPromedio: promedio de la hora de salida de cada dia con clases
// - entradaMasTemprana y salidaMasTardia: extremos de toda la semana
function calcularMetricas(horario) {
    const sesionesPorDia = {};
    obtenerSesionesDeHorario(horario).forEach(sesion => {
        if (!sesionesPorDia[sesion.dia]) sesionesPorDia[sesion.dia] = [];
        sesionesPorDia[sesion.dia].push(sesion);
    });

    const dias = Object.keys(sesionesPorDia);
    let minutosMuertos = 0;
    let sumaSalidas = 0;
    let entradaMasTemprana = Infinity;
    let salidaMasTardia = -Infinity;

    dias.forEach(dia => {
        const sesiones = sesionesPorDia[dia].sort((a, b) => a.inicio - b.inicio);

        for (let i = 1; i < sesiones.length; i++) {
            // en un horario valido no hay solapes, asi que el hueco nunca es negativo
            minutosMuertos += sesiones[i].inicio - sesiones[i - 1].fin;
        }

        const salidaDelDia = Math.max(...sesiones.map(s => s.fin));
        sumaSalidas += salidaDelDia;
        entradaMasTemprana = Math.min(entradaMasTemprana, sesiones[0].inicio);
        salidaMasTardia = Math.max(salidaMasTardia, salidaDelDia);
    });

    return {
        diasAsistencia: dias.length,
        minutosMuertos,
        salidaPromedio: dias.length > 0 ? sumaSalidas / dias.length : 0,
        entradaMasTemprana: dias.length > 0 ? entradaMasTemprana : 0,
        salidaMasTardia: dias.length > 0 ? salidaMasTardia : 0
    };
}

// devuelve una copia ordenada; las metricas se calculan una sola vez por horario
// y sort es estable, asi que los empates conservan el orden de generacion
function ordenarHorarios(horarios, criterio = criterioOrdenActivo) {
    if (criterio === "") return [...horarios];

    const campo = {
        dias: "diasAsistencia",
        "horas-muertas": "minutosMuertos",
        salida: "salidaPromedio"
    }[criterio];

    return horarios
        .map(horario => ({ horario, metricas: calcularMetricas(horario) }))
        .sort((a, b) => a.metricas[campo] - b.metricas[campo])
        .map(item => item.horario);
}

// "2 h 15 min", "45 min" o "0 min"
function formatearDuracion(minutos) {
    const horas = Math.floor(minutos / 60);
    const resto = Math.round(minutos % 60);
    if (horas === 0) return `${resto} min`;
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

// minutos desde la medianoche a "HH:MM"
function convertirMinutosAHora(minutos) {
    const redondeados = Math.round(minutos);
    const horas = String(Math.floor(redondeados / 60)).padStart(2, "0");
    const resto = String(redondeados % 60).padStart(2, "0");
    return `${horas}:${resto}`;
}
