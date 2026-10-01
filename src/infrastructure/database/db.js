require('dotenv').config();
const mysql = require('mysql2/promise'); // <-- El '/promise' arregla el error

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Verificación de conexión
pool.getConnection()
    .then(connection => {
        console.log('🔥 Conectado al Pool de MySQL (miFuturo)');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
    });

module.exports = pool;