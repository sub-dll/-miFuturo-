const mysql = require('mysql2/promise');
require('dotenv').config();
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mifuturo',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,       // Permite hasta 10 usuarios consultando al mismo tiempo
  queueLimit: 0
});

// Como ya usamos mysql2/promise arriba, pool ya es una promesa directamente.

pool.getConnection()
    .then(connection => {
        console.log('🔥 Conectado al Pool de MySQL (miFuturo)');
        connection.release(); // Libera el tubo para que otro lo use
    })
    .catch(err => {
        console.error('❌ Error al conectar a MySQL:', err.message);
    });
module.exports = pool;