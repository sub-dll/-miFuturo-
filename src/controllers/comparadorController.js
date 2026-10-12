const pool = require('../infrastructure/database/db');

const renderComparador = async (req, res) => {
    try {
        // 1. Extraemos los parámetros de la URL elegidos en los selects
        const { c1, c2 } = req.query;

        // 2. Consulta A: Obtener TODOS los programas solo para llenar los <select>
        const querySelects = `
            SELECT pu.id_programa, cb.nombre_carrera, u.nombre AS uni_nombre 
            FROM Programa_Universitario pu
            INNER JOIN Universidad u ON pu.id_universidad = u.id_universidad
            INNER JOIN Carrera_Base cb ON pu.id_carrera_base = cb.id_carrera_base
        `;
        const [rowsSelects] = await pool.query(querySelects);
        const listaSelects = rowsSelects.map(row => ({
            id_programa: row.id_programa,
            carrera_nombre: row.nombre_carrera,
            universidad_nombre: row.uni_nombre
        }));

        // 3. Consulta B: Obtener las tarjetas filtradas
        let programas = []; // Empieza como un arreglo vacío por defecto

        // Solo hacemos la consulta a la BD si el usuario seleccionó al menos un filtro
        if (c1 || c2) {
            const queryTarjetas = `
                SELECT 
                    u.nombre AS uni_nombre,
                    u.logo_url AS uni_logo,
                    cb.nombre_carrera,
                    cb.descripcion_general,
                    pu.ingresados_anual,
                    pu.egresados_anual,
                    rp.pct_nem, rp.pct_ranking, rp.pct_m1, rp.pct_m2, rp.pct_lectora, rp.pct_ciencias_historia, rp.pct_corte
                FROM Programa_Universitario pu
                INNER JOIN Universidad u ON pu.id_universidad = u.id_universidad
                INNER JOIN Carrera_Base cb ON pu.id_carrera_base = cb.id_carrera_base
                LEFT JOIN Requisitos_Programa rp ON pu.id_programa = rp.id_programa
                WHERE pu.id_programa IN (?, ?)
            `;

            // Si falta uno de los dos filtros, duplicamos el otro para que el IN(?, ?) de SQL no falle
            const param1 = c1 ? c1 : c2;
            const param2 = c2 ? c2 : c1;

            const [rowsTarjetas] = await pool.query(queryTarjetas, [param1, param2]);

            programas = rowsTarjetas.map(row => ({
                universidad: { nombre: row.uni_nombre, logo_url: row.uni_logo || '/img/default-logo.png' },
                carrera_nombre: row.nombre_carrera,
                descripcion: row.descripcion_general || 'Sin descripción disponible.',
                ingresados_anual: row.ingresados_anual || 0,
                egresados_anual: row.egresados_anual || 0,
                requisitos: { 
                    nem: row.pct_nem || 0, ranking: row.pct_ranking || 0, m1: row.pct_m1 || 0, 
                    m2: row.pct_m2 || 0, lectora: row.pct_lectora || 0, ciencias_historia: row.pct_ciencias_historia || 0, corte: row.pct_corte || 0 
                }
            }));
        }

        // 4. Enviamos todo a la vista EJS
        res.render('comparador', { programas, listaSelects, c1, c2 });

    } catch (error) {
        console.error("Error cargando el comparador:", error);
        res.status(500).send("Error interno obteniendo los datos del comparador");
    }
};

module.exports = { renderComparador };