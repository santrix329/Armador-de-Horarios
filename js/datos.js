/* Almacenamiento en memoria para las materias manuales creadas durante la sesión
 */
let materiasManuales = [];

// dias validos para una sesion, en el orden en que se muestran
const DIAS_SEMANA = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB"];

// Retorna todos los bloques horarios del catálogo oficial
function obtenerBloques() {
    return BLOQUES;
}

// Retorna el catalogo oficial de materias provisto
function obtenerMateriasCatalogo() {
    return MATERIAS;
}

// Retorna las materias manuales registradas por el usuario
function obtenerMateriasManuales() {
    return materiasManuales;
}

// Retorna la unión de las materias del catalogo y las manuales
function obtenerTodasLasMaterias() {
    return [...MATERIAS, ...materiasManuales];
}

/*
 * Busca y retorna una materia especifica por su codigo
 */
function obtenerMateriaPorCodigo(codigo) {
    return obtenerTodasLasMaterias().find(m => m.codigo === codigo);
}

// Agrega una nueva materia manual 
function agregarMateriaManual(materia) {
    materiasManuales.push(materia);
}

// Elimina una materia manual segun su codigo
function eliminarMateriaManual(codigo) {
    materiasManuales = materiasManuales.filter(m => m.codigo !== codigo);
}

// reemplaza una materia manual conservando su posicion en la lista
function actualizarMateriaManual(codigoOriginal, materiaNueva) {
    materiasManuales = materiasManuales.map(m => m.codigo === codigoOriginal ? materiaNueva : m);
}

// indica si el codigo pertenece a una materia manual
function esMateriaManual(codigo) {
    return materiasManuales.some(m => m.codigo === codigo);
}

// indica si el codigo ya esta en uso, sin distinguir mayusculas;
// codigoIgnorado permite excluir a la materia que se esta editando
function existeCodigoMateria(codigo, codigoIgnorado = null) {
    const buscado = codigo.toUpperCase();
    return obtenerTodasLasMaterias().some(m =>
        m.codigo.toUpperCase() === buscado && m.codigo !== codigoIgnorado
    );
}

// busca un bloque del catalogo por su id
function obtenerBloquePorId(id) {
    return BLOQUES.find(b => b.id === id);
}

// devuelve los ids ordenados por hora de inicio real, no por el texto del id
function ordenarIdsBloquesPorInicio(idsBloques) {
    return [...idsBloques].sort((a, b) =>
        convertirHoraAMinutos(obtenerBloquePorId(a).inicio) - convertirHoraAMinutos(obtenerBloquePorId(b).inicio)
    );
}