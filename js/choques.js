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

// aqui reutilizo esta funcion para ver si dos secciones chocan evaluando sus horarios
function seccionesChocanCompletas(seccionA, seccionB) {
    for (let i = 0; i < seccionA.horario.length; i++) {
        for (let j = 0; j < seccionB.horario.length; j++) {
            if (sesionesChocan(seccionA.horario[i], seccionB.horario[j])) {
                return true;
        }
     }
    }
    return false;
}

// aqui detecto materias incompatibles usando la funcion de secciones chocan
function obtenerMateriasIncompatiblesSeleccionadas() {
    let incompatibles = [];
    let lista = materiasSeleccionadas;

    for (let i = 0; i < lista.length; i++) {
     for (let j = i + 1; j < lista.length; j++) {
      let matA = lista[i];
      let matB = lista[j];

        if (!matA.secciones || !matB.secciones) {
                continue;
            }

        let todasChocan = true;

        for (let a = 0; a < matA.secciones.length; a++) {
                let secA = matA.secciones[a];
                let hayOpcionLibre = false;

               for (let b = 0; b < matB.secciones.length; b++) {
                    let secB = matB.secciones[b];

                    // aqui reutilizo la funcion en vez de repetir bucles
                   if (!seccionesChocanCompletas(secA, secB)) {
                  hayOpcionLibre = true;
                }
                }

                if (hayOpcionLibre) {
                    todasChocan = false;
                }
            }

            if (todasChocan) {
                incompatibles.push({
                    materia1: matA.codigo,
                    materia2: matB.codigo
                });
            }
        }
    }

    return incompatibles;
}