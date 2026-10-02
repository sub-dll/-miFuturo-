const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Pon tu contraseña si la configuraste
  database: 'mifuturo'
});

connection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    return;
  }
  console.log('¡Conectado exitosamente a MySQL!');
});

module.exports = connection;