
-----------------------------------
-- DATOS SEMILLA PARA [miFuturo]----
-----------------------------------

-- universidades de temuco

INSERT INTO Universidad (nombre, logo_url, anos_acreditacion, sitio_web, descripcion, ciudad) VALUES
('Universidad de la Frontera', 'https://ejemplo.com/logo-ufro.png', 6, 'https://www.ufro.cl', 'La Universidad de La Frontera (UFRO) es una institución pública y estatal de educación superior...', 'Temuco'),
('Universidad Católica de Temuco', 'https://ejemplo.com/logo-uct.png', 5, 'https://www.uct.cl', 'La Universidad Católica de Temuco es una institución de educación superior tradicional y privada...', 'Temuco'),
('Universidad Mayor', 'https://ejemplo.com/logo-mayor.png', 5, 'https://www.umayor.cl', 'Institución privada con sede en Temuco enfocada en la innovación académica.', 'Temuco');

-- aca se insertan las "carreras genericas"
INSERT INTO Carrera_Base (nombre_carrera, descripcion_general) VALUES
('Ingeniería Civil en Informática', 'Carrera enfocada en el desarrollo de software, gestión de proyectos tecnológicos y arquitectura de sistemas.'),
('Ingeniería Civil Industrial', 'Carrera enfocada en la optimización de procesos, gestión de operaciones y administración de recursos en empresas.'),
('Medicina', 'Formación médica enfocada en el diagnóstico, tratamiento y prevención de enfermedades en seres humanos.');

--  Insertar Programas (la unión entre la Universidad y la Carrera)
-- Nota: Asumimos que los IDs autoincrementales asignados arriba son 1, 2, 3.
INSERT INTO Programa_Universitario (id_universidad, id_carrera_base, semestres, arancel, empleabilidad_pct, ingresados_anual, egresados_anual, sueldo_promedio_1er_ano, sueldo_promedio_2do_ano) VALUES
(1, 1, 11, '3800000', 92, 80, 50, 1200000, 1500000), -- UFRO: Ing. Civil Informática
(2, 1, 10, '3500000', 88, 70, 45, 1100000, 1400000), -- UCT: Ing. Civil Informática
(1, 3, 14, '5200000', 98, 60, 55, 1800000, 2100000); -- UFRO: Medicina

--  Insertar Requisitos para esos Programas (Basado en el mockup del comparador)
-- Los porcentajes suman 100%
INSERT INTO Requisitos_Programa (id_programa, pct_nem, pct_ranking, pct_m1, pct_m2, pct_lectora, pct_ciencias_historia, pct_corte) VALUES
(1, 10, 40, 25, 5, 10, 10, 680), -- Requisitos Informática UFRO
(2, 10, 40, 25, 5, 10, 10, 650); -- Requisitos Informática UCT

-- Insertar un par de Usuarios de prueba (Tú y un compañero)
INSERT INTO Usuario (nombres, apellidos, email, telefono, password, username, avatar_url, tipo_perfil) VALUES
('Diego', 'Fonseca', 'diego.fonseca@ejemplo.com', '+56912345678', 'contrasena_encriptada_123', 'Don quijote', 'https://ejemplo.com/avatar1.png', 'Estudiante'),
('Bayron', 'Apellido', 'bayron@ejemplo.com', '+56987654321', 'contrasena_encriptada_456', 'BayronDev', 'https://ejemplo.com/avatar2.png', 'Egresado');