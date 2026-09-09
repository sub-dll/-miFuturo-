const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Le decimos a Express que la carpeta "public" es la cara visible de la web
app.use(express.static(path.join(__dirname, '../public')));

// Encendemos el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor de miFuturo corriendo en http://localhost:${PORT}`);
});