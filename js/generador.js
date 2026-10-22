/*
 * logica para combinar las materias y generar los horarios validos
 */

function generarHorarios() {
    let seleccion = materiasSeleccionadas

    if (!seleccion || seleccion.length === 0) {
        return []
    }

    let horariosValidos = []
    let materiasConSecciones = []

    for (let i = 0; i < seleccion.length; i++) {
        let mat = seleccion[i]
        let seccionesValidas = filtrarSeccionesDisponibles(mat)

        if (seccionesValidas.length === 0) {
            return []
        }

        materiasConSecciones.push({
            materia: mat,
            secciones: seccionesValidas
        })
    }

    explorarCombinaciones(0, materiasConSecciones, [], horariosValidos)
    return horariosValidos
}

function filtrarSeccionesDisponibles(materia) {
    let seccionesValidas = []
    let secciones = materia.secciones

    if (!secciones) return seccionesValidas

    for (let i = 0; i < secciones.length; i++) {
        let sec = secciones[i]

        if (materia.seccionesExcluidas && materia.seccionesExcluidas.includes(sec.id)) {
            continue
        }

        if (materia.seccionesFijadas && materia.seccionesFijadas.length > 0) {
            if (!materia.seccionesFijadas.includes(sec.id)) {
                continue
            }
        }

        seccionesValidas.push(sec)
    }

    return seccionesValidas
}

function explorarCombinaciones(indiceMateria, materiasConSecciones, combinacionActual, horariosValidos) {
    if (indiceMateria === materiasConSecciones.length) {
        horariosValidos.push([...combinacionActual])
        return
    }

    let actual = materiasConSecciones[indiceMateria]
    let secciones = actual.secciones

    for (let i = 0; i < secciones.length; i++) {
        let seccionPrueba = secciones[i]

        if (tieneChoqueConSeleccion(seccionPrueba, combinacionActual)) {
            continue
        }

        combinacionActual.push({
            materia: actual.materia,
            seccion: seccionPrueba
        })

        explorarCombinaciones(indiceMateria + 1, materiasConSecciones, combinacionActual, horariosValidos)
        combinacionActual.pop()
    }
}

function tieneChoqueConSeleccion(seccionNueva, combinacionActual) {
    for (let j = 0; j < combinacionActual.length; j++) {
        let seccionYaElegida = combinacionActual[j].seccion

        if (seccionesChocanCompletas(seccionYaElegida, seccionNueva)) {
            return true
        }
    }
    return false
}