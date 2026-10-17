/* Almacenamiento en memoria para las materias manuales creadas durante la sesión
 */
let materiasManuales = [];

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