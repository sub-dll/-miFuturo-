// =====================================================================
// Prueba automática del perfil (SELECT, render EJS y validación de correo)
// Uso:  1) npm start   (en otra terminal)
//       2) node scripts/probar-perfil.js
// Requiere Node 18+ (usa fetch nativo). Crea 2 usuarios de prueba y los borra al final.
// =====================================================================
const db = require('../src/infrastructure/database/db');

const BASE = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const sufijo = Date.now();
const A = { nombres: 'Prueba Perfil A', email: `perfil.a.${sufijo}@test.cl`, telefono: '+56911111111', password: 'claveSegura123' };
const B = { nombres: 'Prueba Perfil B', email: `perfil.b.${sufijo}@test.cl`, telefono: '+56922222222', password: 'claveSegura456' };

let ok = 0, fallos = 0;
const check = (cond, msg) => { cond ? ok++ : fallos++; console.log(`${cond ? '✅' : '❌'} ${msg}`); };

const post = (ruta, datos, cookie) => fetch(BASE + ruta, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...(cookie ? { Cookie: cookie } : {}) },
    body: new URLSearchParams(datos)
});
const get = (ruta, cookie) => fetch(BASE + ruta, { redirect: 'manual', headers: cookie ? { Cookie: cookie } : {} });

(async () => {
    try {
        // 0. Sin sesión → debe redirigir a /login
        let r = await get('/perfil');
        check(r.status === 302 && r.headers.get('location') === '/login', 'GET /perfil sin sesión redirige a /login');

        // 1. Registrar dos usuarios
        await post('/registro', A);
        await post('/registro', B);

        // 2. Login como A y guardar la cookie de sesión
        r = await post('/login', { email: A.email, password: A.password });
        const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
        check(r.status === 302 && cookie.startsWith('connect.sid='), 'Login de A crea la sesión');

        // 3. El perfil muestra los datos reales sacados de MySQL
        r = await get('/perfil', cookie);
        let html = await r.text();
        check(r.status === 200, 'GET /perfil con sesión responde 200');
        check(html.includes(A.nombres), 'La vista muestra usuario.nombres');
        check(html.includes(A.email), 'La vista muestra usuario.email');
        check(html.includes(A.telefono), 'La vista muestra usuario.telefono');
        check(!html.includes('$2'), 'La vista NO expone el hash de la contraseña');

        // 4. Intentar cambiar el correo de A al correo de B → rechazado
        r = await post('/perfil/actualizar', { campo: 'email', valor: B.email }, cookie);
        html = await r.text();
        check(r.status === 409 && html.includes('ya está registrado por otro usuario'), 'Correo duplicado es rechazado con mensaje de error');

        // 5. Validación de formato
        r = await post('/perfil/actualizar', { campo: 'email', valor: 'no-es-un-correo' }, cookie);
        check(r.status === 400, 'Correo con formato inválido es rechazado (400)');
        r = await post('/perfil/actualizar', { campo: 'password', valor: '123' }, cookie);
        check(r.status === 400, 'Contraseña corta es rechazada (400)');
        r = await post('/perfil/actualizar', { campo: 'nombres; DROP TABLE Usuario', valor: 'x' }, cookie);
        check(r.status === 400, 'Campo no permitido es rechazado (400)');

        // 6. Cambio válido de correo → redirige y el perfil muestra el nuevo valor
        const nuevoEmail = `perfil.a.nuevo.${sufijo}@test.cl`;
        r = await post('/perfil/actualizar', { campo: 'email', valor: nuevoEmail }, cookie);
        check(r.status === 302 && r.headers.get('location') === '/perfil?ok=email', 'Cambio de correo válido redirige a /perfil?ok=email');
        html = await (await get('/perfil?ok=email', cookie)).text();
        check(html.includes(nuevoEmail) && html.includes('correctamente'), 'El perfil muestra el nuevo correo y el mensaje de éxito');
        A.email = nuevoEmail;

        // 7. Cambio de contraseña → se guarda encriptada y sirve para iniciar sesión
        r = await post('/perfil/actualizar', { campo: 'password', valor: 'otraClave789' }, cookie);
        check(r.status === 302, 'Cambio de contraseña aceptado');
        r = await post('/login', { email: A.email, password: 'otraClave789' });
        check(r.status === 302, 'Login funciona con la nueva contraseña');
    } catch (e) {
        fallos++;
        console.error('❌ Error ejecutando la prueba (¿está corriendo el servidor con `npm start`?):', e.message);
    } finally {
        await db.query('DELETE FROM Usuario WHERE email LIKE ?', [`perfil.%.${sufijo}@test.cl`]).catch(() => {});
        await db.query('DELETE FROM Usuario WHERE email LIKE ?', [`perfil.a.nuevo.${sufijo}@test.cl`]).catch(() => {});
        await db.end();
        console.log(`\nResultado: ${ok} OK, ${fallos} fallos`);
        process.exit(fallos ? 1 : 0);
    }
})();
