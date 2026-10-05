require('dotenv').config();
const mysql = require('mysql2/promise'); // <-- El '/promise' arregla el error


const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT, 
    waitForConnections: true,
    connectionLimit: 10,       // Permite hasta 10 usuarios consultando al mismo tiempo
    queueLimit: 0
});


const promisePool = pool.promise();


promisePool.getConnection()
    .then(connection => {
        console.log('🔥 Conectado al Pool de MySQL (miFuturo)');
        connection.release(); // Libera el tubo para que otro lo use
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
    });


module.exports = promisePool;
