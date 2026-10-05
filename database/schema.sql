-- 1. Tablas independientes (No dependen de otras)
CREATE TABLE `Usuario` (
  `id_usuario` INT AUTO_INCREMENT PRIMARY KEY,
  `nombres` VARCHAR(100),
  `apellidos` VARCHAR(100),
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `telefono` VARCHAR(20),
  `password` VARCHAR(255) NOT NULL,
  `username` VARCHAR(50) UNIQUE,
  `avatar_url` VARCHAR(255),
  `tipo_perfil` VARCHAR(20)
);

CREATE TABLE `Universidad` (
  `id_universidad` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100),
  `logo_url` VARCHAR(255),
  `años_acreditacion` INT,
  `sitio_web` VARCHAR(255),
  `descripcion` TEXT,
  `ciudad` VARCHAR(50)
);

CREATE TABLE `Carrera_Base` (
  `id_carrera_base` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre_carrera` VARCHAR(100),
  `descripcion_general` TEXT
);

-- 2. Tablas de Nivel 2 (Dependen de las de Nivel 1)
CREATE TABLE `Configuracion` (
  `id_usuario` INT PRIMARY KEY,
  `tema` VARCHAR(20) DEFAULT 'claro',
  `contraste_alto` BOOLEAN DEFAULT FALSE,
  `idioma` VARCHAR(20) DEFAULT 'es',
  `notif_comentarios` BOOLEAN DEFAULT TRUE,
  `notif_menciones` BOOLEAN DEFAULT TRUE,
  `notif_email` BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`) ON DELETE CASCADE
);

CREATE TABLE `Programa_Universitario` (
  `id_programa` INT AUTO_INCREMENT PRIMARY KEY,
  `id_universidad` INT,
  `id_carrera_base` INT,
  `semestres` INT,
  `arancel` VARCHAR(50),
  `empleabilidad_pct` INT,
  `ingresados_anual` INT,
  `egresados_anual` INT,
  `sueldo_promedio_1er_ano` INT,
  `sueldo_promedio_2do_ano` INT,
  FOREIGN KEY (`id_universidad`) REFERENCES `Universidad`(`id_universidad`),
  FOREIGN KEY (`id_carrera_base`) REFERENCES `Carrera_Base`(`id_carrera_base`)
);

-- 3. Tablas de Nivel 3 (Tablas relacionales y dependientes)
CREATE TABLE `Requisitos_Programa` (
  `id_programa` INT PRIMARY KEY,
  `pct_nem` INT,
  `pct_ranking` INT,
  `pct_m1` INT,
  `pct_m2` INT,
  `pct_lectora` INT,
  `pct_ciencias_historia` INT,
  `pct_corte` INT,
  FOREIGN KEY (`id_programa`) REFERENCES `Programa_Universitario`(`id_programa`) ON DELETE CASCADE
);

CREATE TABLE `Usuario_Universidad` (
  `id_usuario` INT,
  `id_universidad` INT,
  `fecha_inicio` DATE,
  PRIMARY KEY (`id_usuario`, `id_universidad`),
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`),
  FOREIGN KEY (`id_universidad`) REFERENCES `Universidad`(`id_universidad`)
);

CREATE TABLE `Usuario_Programa` (
  `id_usuario` INT,
  `id_programa` INT,
  `validado` BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (`id_usuario`, `id_programa`),
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`),
  FOREIGN KEY (`id_programa`) REFERENCES `Programa_Universitario`(`id_programa`)
);

CREATE TABLE `Hilo` (
  `id_hilo` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150),
  `contenido` TEXT,
  `fecha_publicacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `likes` INT DEFAULT 0,
  `dislikes` INT DEFAULT 0,
  `id_usuario` INT,
  `id_programa` INT,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`),
  FOREIGN KEY (`id_programa`) REFERENCES `Programa_Universitario`(`id_programa`)
);

CREATE TABLE `Comentario` (
  `id_comentario` INT AUTO_INCREMENT PRIMARY KEY,
  `id_hilo` INT,
  `id_usuario` INT,
  `parent_comentario_id` INT NULL,
  `contenido` TEXT,
  `fecha_publicacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `likes` INT DEFAULT 0,
  `dislikes` INT DEFAULT 0,
  FOREIGN KEY (`id_hilo`) REFERENCES `Hilo`(`id_hilo`) ON DELETE CASCADE,
  FOREIGN KEY (`id_usuario`) REFERENCES `Usuario`(`id_usuario`),
  FOREIGN KEY (`parent_comentario_id`) REFERENCES `Comentario`(`id_comentario`)
);