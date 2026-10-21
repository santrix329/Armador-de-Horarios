/*
 * validaciones de las materias manuales
 * no tocan el dom: devuelven un objeto { ruta: mensaje } y el formulario decide donde mostrarlo
 * las rutas siguen la forma de los datos, por ejemplo "secciones.0.horario.1.bloques"
 */

// valida los datos crudos del formulario; codigoOriginal se usa al editar para no chocar consigo misma
function validarMateriaManual(datos, codigoOriginal = null) {
    const errores = {};

    if (datos.codigo === "") {
        errores.codigo = "El código es obligatorio.";
    } else if (existeCodigoMateria(datos.codigo, codigoOriginal)) {
        errores.codigo = "Ya existe una materia con ese código.";
    }

    if (datos.nombre === "") {
        errores.nombre = "El nombre es obligatorio.";
    }

    const trimestre = Number(datos.trimestre);
    if (datos.trimestre === "") {
        errores.trimestre = "El trimestre es obligatorio.";
    } else if (!Number.isInteger(trimestre) || trimestre < 1) {
        errores.trimestre = "El trimestre debe ser un número entero positivo.";
    }

    const uc = Number(datos.uc);
    if (datos.uc === "") {
        errores.uc = "Las unidades de crédito son obligatorias.";
    } else if (!Number.isInteger(uc) || uc < 1 || uc > 5) {
        errores.uc = "Las unidades de crédito deben ser un número entero entre 1 y 5.";
    }

    if (datos.secciones.length === 0) {
        errores.secciones = "Se requiere al menos una sección.";
    }

    datos.secciones.forEach((seccion, indice) => {
        validarSeccion(seccion, indice, datos.secciones, errores);
    });

    return errores;
}

// valida una seccion y sus sesiones, agregando los errores encontrados
function validarSeccion(seccion, indice, secciones, errores) {
    const ruta = `secciones.${indice}`;

    if (seccion.id === "") {
        errores[`${ruta}.id`] = "El identificador de la sección es obligatorio.";
    } else if (secciones.findIndex(s => s.id === seccion.id) !== indice) {
        // solo se marca la repetida, no la primera aparicion
        errores[`${ruta}.id`] = "Ya existe otra sección con ese identificador en esta materia.";
    }

    if (seccion.profesor === "") {
        errores[`${ruta}.profesor`] = "El profesor es obligatorio.";
    }

    if (seccion.horario.length === 0) {
        errores[`${ruta}.horario`] = "Se requiere al menos una sesión.";
        return;
    }

    seccion.horario.forEach((sesion, j) => {
        validarSesion(sesion, `${ruta}.horario.${j}`, errores);
    });

    validarChoquesInternos(seccion.horario, `${ruta}.horario`, errores);
}

// valida los campos de una sesion
function validarSesion(sesion, ruta, errores) {
    if (!DIAS_SEMANA.includes(sesion.dia)) {
        errores[`${ruta}.dia`] = "Selecciona un día.";
    }

    const errorBloques = validarBloquesSesion(sesion.bloques);
    if (errorBloques !== "") {
        errores[`${ruta}.bloques`] = errorBloques;
    }

    if (sesion.aula === "") {
        errores[`${ruta}.aula`] = "El aula es obligatoria.";
    }
}

// los bloques deben existir, ser del mismo tipo y quedar uno detras de otro, sin huecos ni solapes
function validarBloquesSesion(idsBloques) {
    if (idsBloques.length === 0) {
        return "Selecciona al menos un bloque.";
    }

    const bloques = idsBloques.map(obtenerBloquePorId);
    if (bloques.some(b => !b)) {
        return "Hay un bloque que no existe en el catálogo.";
    }

    const tipos = new Set(bloques.map(b => b.tipo));
    if (tipos.size > 1) {
        return "Los bloques de una sesión deben ser del mismo tipo.";
    }

    // se compara por horas: el fin de cada bloque debe ser el inicio del siguiente
    const ordenados = ordenarIdsBloquesPorInicio(idsBloques).map(obtenerBloquePorId);
    for (let i = 1; i < ordenados.length; i++) {
        if (convertirHoraAMinutos(ordenados[i - 1].fin) !== convertirHoraAMinutos(ordenados[i].inicio)) {
            return "Los bloques de una sesión deben ser consecutivos.";
        }
    }

    return "";
}

// las sesiones de una misma seccion no pueden chocar entre si
// solo se comparan las sesiones que ya pasaron sus propias validaciones
function validarChoquesInternos(horario, ruta, errores) {
    const esValida = j =>
        !errores[`${ruta}.${j}.dia`] && !errores[`${ruta}.${j}.bloques`];

    for (let j = 0; j < horario.length; j++) {
        if (!esValida(j)) continue;

        for (let k = 0; k < j; k++) {
            if (!esValida(k)) continue;

            const sesionA = { ...horario[k], bloques: ordenarIdsBloquesPorInicio(horario[k].bloques) };
            const sesionB = { ...horario[j], bloques: ordenarIdsBloquesPorInicio(horario[j].bloques) };

            if (sesionesChocan(sesionA, sesionB)) {
                errores[`${ruta}.${j}`] = `Choca con la sesión ${k + 1} de esta misma sección.`;
                break;
            }
        }
    }
}
