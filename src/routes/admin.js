const express = require('express');
const router = express.Router();
const db = require('../infrastructure/database/db');

// Importar el middleware que acabas de crear
const { verificarAdmin } = require('../middlewares/adminMiddleware');

// Aplicar el middleware de seguridad a TODAS las rutas de este archivo automáticamente
router.use(verificarAdmin);

// Ruta base del panel: GET /admin
router.get('/', async (req, res) => {
    try {
        // 1. Cargar datos para Gestión de Miembros (MIF-100)
        const [usuarios] = await db.query(`
            SELECT id_usuario, nombres, apellidos, username, email, tipo_perfil, estado 
            FROM Usuario 
            ORDER BY id_usuario DESC
        `);

        // 2. Cargar datos para Gestión Académica (MIF-95)
        const [universidades] = await db.query(`
            SELECT id_universidad, nombre, ciudad, años_acreditacion 
            FROM Universidad 
            ORDER BY nombre ASC
        `);

        // Renderizar la vista del panel pasando los datos
        res.render('admin-panel', { 
            user: req.session.user, 
            usuarios, 
            universidades 
        });
    } catch (error) {
        console.error('Error al cargar el panel de administrador:', error);
        res.status(500).send('Error interno al cargar el panel.');
    }
});

// ==========================================
// RUTAS DE MODERACIÓN DE MIEMBROS (MIF-103)
// ==========================================

// 1. Cambiar estado (Activar / Inhabilitar)
router.post('/usuario/estado', async (req, res) => {
    try {
        const { id_usuario, nuevo_estado } = req.body;
        // Evitar que el admin se inhabilite a sí mismo por accidente
        if (id_usuario === req.session.user.id_usuario) {
            return res.status(400).json({ success: false, message: "No puedes inhabilitar tu propia cuenta." });
        }
        await db.query('UPDATE Usuario SET estado = ? WHERE id_usuario = ?', [nuevo_estado, id_usuario]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor.' });
    }
});

// 2. Cambiar Rol de Usuario
router.post('/usuario/rol', async (req, res) => {
    try {
        const { id_usuario, nuevo_rol } = req.body;
        if (id_usuario === req.session.user.id_usuario) {
            return res.status(400).json({ success: false, message: "No puedes cambiar tu propio rol por seguridad." });
        }
        await db.query('UPDATE Usuario SET tipo_perfil = ? WHERE id_usuario = ?', [nuevo_rol, id_usuario]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error al cambiar rol:', error);
        res.status(500).json({ success: false, message: 'Error en el servidor.' });
    }
});

// 3. Eliminar Usuario Permanente (con borrado en cascada manual)
router.post('/usuario/eliminar', async (req, res) => {
    try {
        const { id_usuario } = req.body;
        if (id_usuario === req.session.user.id_usuario) {
            return res.status(400).json({ success: false, message: "No puedes eliminar tu propia cuenta en uso." });
        }

        // Borrado manual en cascada para evitar el error #1451 de llaves foráneas
        await db.query('DELETE FROM Comentario WHERE id_usuario = ?', [id_usuario]);
        await db.query('DELETE FROM Hilo WHERE id_usuario = ?', [id_usuario]);
        await db.query('DELETE FROM Usuario_Programa WHERE id_usuario = ?', [id_usuario]);
        await db.query('DELETE FROM Usuario_Universidad WHERE id_usuario = ?', [id_usuario]);
        await db.query('DELETE FROM Configuracion WHERE id_usuario = ?', [id_usuario]);
        
        // Finalmente, eliminamos al usuario
        await db.query('DELETE FROM Usuario WHERE id_usuario = ?', [id_usuario]);
        
        res.json({ success: true });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ success: false, message: 'Error al intentar eliminar el usuario.' });
    }
});

// ==========================================
// RUTAS DE GESTIÓN ACADÉMICA (CRUD) - MIF-99
// ==========================================

// 1. Crear nueva Universidad
router.post('/universidad/crear', async (req, res) => {
    try {
        // Extraemos los datos enviados por el formulario del Modal
        const { nombre, años_acreditacion, ciudad, logo_url, sitio_web, descripcion } = req.body;

        // Inyectamos de forma segura usando parámetros (?) para evitar inyección SQL
        await db.query(
            `INSERT INTO Universidad (nombre, años_acreditacion, ciudad, logo_url, sitio_web, descripcion) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
                nombre, 
                años_acreditacion, 
                ciudad, 
                logo_url || null, 
                sitio_web || null, 
                descripcion || null
            ]
        );

        // Al terminar, recargamos el panel de control
        res.redirect('/admin');
        
    } catch (error) {
        console.error('❌ Error al crear universidad:', error);
        res.status(500).send('Error interno al intentar guardar la universidad.');
    }
});

// 2. Editar Universidad existente
router.post('/universidad/editar', async (req, res) => {
    try {
        const { id_universidad, nombre, años_acreditacion, ciudad, logo_url, sitio_web, descripcion } = req.body;
        await db.query(
            `UPDATE Universidad SET nombre = ?, años_acreditacion = ?, ciudad = ?, logo_url = ?, sitio_web = ?, descripcion = ? 
             WHERE id_universidad = ?`,
            [nombre, años_acreditacion, ciudad, logo_url || null, sitio_web || null, descripcion || null, id_universidad]
        );
        res.redirect('/admin');
    } catch (error) {
        console.error('❌ Error al editar universidad:', error);
        res.status(500).send('Error interno al actualizar la universidad.');
    }
});

// 3. Eliminar Universidad (CON CASCADA COMPLETA)
router.post('/universidad/eliminar', async (req, res) => {
    try {
        const { id_universidad } = req.body;

        // 1. Obtener todos los programas asociados a esta universidad
        const [programas] = await db.query('SELECT id_programa FROM Programa_Universitario WHERE id_universidad = ?', [id_universidad]);

        // Si la universidad tiene programas, limpiamos sus dependencias primero
        if (programas.length > 0) {
            const idsProgramas = programas.map(p => p.id_programa);

            // A. Borrar los Requisitos PAES de esos programas
            await db.query('DELETE FROM Requisitos_Programa WHERE id_programa IN (?)', [idsProgramas]);

            // B. Borrar las relaciones de usuarios (favoritos) con esos programas
            await db.query('DELETE FROM Usuario_Programa WHERE id_programa IN (?)', [idsProgramas]);

            // C. Limpiar el foro: buscar hilos de estos programas para borrar sus comentarios
            const [hilos] = await db.query('SELECT id_hilo FROM Hilo WHERE id_programa IN (?)', [idsProgramas]);
            if (hilos.length > 0) {
                const idsHilos = hilos.map(h => h.id_hilo);
                await db.query('DELETE FROM Comentario WHERE id_hilo IN (?)', [idsHilos]);
            }
            // Borrar los hilos de los programas
            await db.query('DELETE FROM Hilo WHERE id_programa IN (?)', [idsProgramas]);
        }

        // 2. Ahora sí podemos borrar los Programas Universitarios
        await db.query('DELETE FROM Programa_Universitario WHERE id_universidad = ?', [id_universidad]);

        // 3. Borrar la relación de usuarios suscritos/asociados a la Universidad
        await db.query('DELETE FROM Usuario_Universidad WHERE id_universidad = ?', [id_universidad]);

        // 4. Finalmente, borrar la institución matriz
        await db.query('DELETE FROM Universidad WHERE id_universidad = ?', [id_universidad]);

        res.json({ success: true });
    } catch (error) {
        console.error('❌ Error al eliminar universidad:', error);
        res.status(500).json({ success: false, message: 'Error de integridad: No se pudieron limpiar las dependencias de la universidad.' });
    }
});

module.exports = router;