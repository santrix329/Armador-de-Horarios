// Convierte una hora "HH:MM" a minutos totales desde las 00:00
function convertirHoraAMinutos(horaStr) {
    const partes = horaStr.split(":");
    const horas = parseInt(partes[0], 10);
    const minutos = parseInt(partes[1], 10);
    return (horas * 60) + minutos;
}

// Comprueba si dos intervalos de tiempo se superponen (true si hay choque)
function seSolapanIntervalos(inicioA, finA, inicioB, finB) {
    const minInicioA = convertirHoraAMinutos(inicioA);
    const minFinA = convertirHoraAMinutos(finA);
    const minInicioB = convertirHoraAMinutos(inicioB);
    const minFinB = convertirHoraAMinutos(finB);

    // Nota: Si una sesión termina exactamente cuando empieza otra, NO hay choque (< y >)
    return (minInicioA < minFinB) && (minFinA > minInicioB);
}