/*
 * rejilla semanal construida con css grid
 * columna 1: horas; columnas 2 a 7: lunes a sabado; fila 1: encabezados
 * la fila de inicio y la extension de cada sesion se calculan a partir de sus horas
 */

// alto en pixeles de un minuto (fila mas linea divisoria); 1.4 px da 84 px por hora
const PIXELES_POR_MINUTO = 1.4;

// separacion entre filas que define el gap de .rejilla en styles.css
const GROSOR_LINEA_REJILLA = 1;

function maximoComunDivisor(a, b) {
    return b === 0 ? a : maximoComunDivisor(b, a % b);
}

// escala vertical: abarca todos los bloques del catalogo, desde la hora en punto
// anterior al primer inicio hasta la hora en punto posterior al ultimo fin.
// cada fila mide el maximo comun divisor de todas las horas (contadas desde el inicio),
// asi cualquier hora del catalogo cae justo en el borde de una fila
function calcularEscalaRejilla() {
    const inicios = BLOQUES.map(b => convertirHoraAMinutos(b.inicio));
    const fines = BLOQUES.map(b => convertirHoraAMinutos(b.fin));

    const inicio = Math.floor(Math.min(...inicios) / 60) * 60;
    const fin = Math.ceil(Math.max(...fines) / 60) * 60;

    // se parte de 60 para que las horas en punto tambien caigan en un borde
    let minutosPorFila = 60;
    [...inicios, ...fines].forEach(minutos => {
        minutosPorFila = maximoComunDivisor(minutosPorFila, minutos - inicio);
    });

    return {
        inicio,
        fin,
        minutosPorFila,
        filas: (fin - inicio) / minutosPorFila
    };
}

// un color por materia segun su posicion dentro del horario; todos los resultados de una
// misma generacion tienen las materias en el mismo orden, asi que el color se conserva.
// el angulo aureo (137.5 grados) separa los tonos para que dos materias vecinas no se parezcan
function obtenerColorMateria(indice) {
    const tono = Math.round(indice * 137.5) % 360;
    return `hsl(${tono} 55% 36%)`;
}

// crea el elemento de una sesion; si hay alSeleccionar es un boton que abre su detalle
function crearSesionRejilla(materia, seccion, sesion, indiceMateria, escala, alSeleccionar) {
    const horas = obtenerHorarioSesionEnTexto(sesion);
    const inicio = convertirHoraAMinutos(horas.inicio);
    const fin = convertirHoraAMinutos(horas.fin);

    const elemento = crearElemento(alSeleccionar ? "button" : "div", "sesion-rejilla");
    if (alSeleccionar) elemento.type = "button";

    // fila 1 es el encabezado, por eso el inicio de la escala cae en la fila 2
    const filaInicio = (inicio - escala.inicio) / escala.minutosPorFila + 2;
    const filasQueOcupa = (fin - inicio) / escala.minutosPorFila;

    elemento.style.gridColumn = DIAS_SEMANA.indexOf(sesion.dia) + 2;
    elemento.style.gridRow = `${filaInicio} / span ${filasQueOcupa}`;
    elemento.style.setProperty("--color-materia", obtenerColorMateria(indiceMateria));

    elemento.append(
        crearElemento("strong", "sesion-rejilla-codigo", materia.codigo),
        crearElemento("span", "", `Sec. ${seccion.id}`),
        crearElemento("span", "", sesion.aula)
    );
    elemento.setAttribute(
        "aria-label",
        `${materia.codigo} ${materia.nombre}, sección ${seccion.id}, ${NOMBRES_DIAS[sesion.dia]} de ${horas.inicio} a ${horas.fin}, aula ${sesion.aula}`
    );

    if (alSeleccionar) {
        elemento.addEventListener("click", () => alSeleccionar({ materia, seccion, sesion, horas }));
    }
    return elemento;
}

// pinta un horario dentro del contenedor indicado
// horario: [{ materia, seccion }, ...] tal como lo devuelve generarHorarios
// alSeleccionar: funcion opcional que recibe la sesion pulsada (la vista de resumen no la usa)
function renderizarRejilla(contenedor, horario, alSeleccionar = null, claseAnimacion = "") {
    const escala = calcularEscalaRejilla();
    const rejilla = crearElemento("div", `rejilla ${claseAnimacion}`.trim());
    rejilla.setAttribute("role", "group");
    rejilla.setAttribute("aria-label", "Horario semanal");

    // el alto de fila se ajusta para que cada minuto mida lo mismo con cualquier escala
    rejilla.style.setProperty("--filas", escala.filas);
    rejilla.style.setProperty("--alto-fila", `${escala.minutosPorFila * PIXELES_POR_MINUTO - GROSOR_LINEA_REJILLA}px`);
    rejilla.style.setProperty("--alto-hora", `${60 * PIXELES_POR_MINUTO}px`);

    const nodos = [crearElemento("div", "rejilla-header-dia rejilla-esquina")];

    DIAS_SEMANA.forEach((dia, i) => {
        const encabezado = crearElemento("div", "rejilla-header-dia", NOMBRES_DIAS[dia]);
        encabezado.style.gridColumn = i + 2;
        encabezado.style.gridRow = 1;

        // fondo de la columna del dia, con las lineas de cada hora
        const fondo = crearElemento("div", "rejilla-fondo-dia");
        fondo.style.gridColumn = i + 2;
        fondo.style.gridRow = `2 / span ${escala.filas}`;

        nodos.push(encabezado, fondo);
    });

    const filasPorHora = 60 / escala.minutosPorFila;
    for (let minutos = escala.inicio; minutos < escala.fin; minutos += 60) {
        const etiqueta = crearElemento("div", "rejilla-hora-etiqueta", convertirMinutosAHora(minutos));
        etiqueta.style.gridColumn = 1;
        etiqueta.style.gridRow = `${(minutos - escala.inicio) / escala.minutosPorFila + 2} / span ${filasPorHora}`;
        nodos.push(etiqueta);
    }

    horario.forEach(({ materia, seccion }, indiceMateria) => {
        seccion.horario.forEach(sesion => {
            nodos.push(crearSesionRejilla(materia, seccion, sesion, indiceMateria, escala, alSeleccionar));
        });
    });

    rejilla.append(...nodos);

    // en pantallas estrechas la rejilla se desplaza dentro de su contenedor sin romper la pagina
    const desplazable = crearElemento("div", "rejilla-desplazable");
    desplazable.append(rejilla);
    contenedor.replaceChildren(desplazable);
}
