-- 1. Tablas Independientes (No dependen de otras)
CREATE TABLE Usuario (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombres VARCHAR(100),
    apellidos VARCHAR(100),
    email VARCHAR(100),
    telefono VARCHAR(20),
    password VARCHAR(256),
    username VARCHAR(50),
    avatar_url VARCHAR(255),
    tipo_perfil VARCHAR(20)
);

CREATE TABLE Universidad (
    id_universidad INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100),
    logo_url VARCHAR(255),
    anos_acreditacion INT,
    sitio_web VARCHAR(255),
    descripcion TEXT,
    ciudad VARCHAR(50)
);

CREATE TABLE Carrera_Base (
    id_carrera_base INT AUTO_INCREMENT PRIMARY KEY,
    nombre_carrera VARCHAR(100),
    descripcion_general TEXT
);

-- 2. Tablas de Primer Nivel de Dependencia
CREATE TABLE Configuracion (
    id_usuario INT PRIMARY KEY,
    tema VARCHAR(20),
    contraste_alto BOOLEAN,
    idioma VARCHAR(20),
    notif_comentarios BOOLEAN,
    notif_menciones BOOLEAN,
    notif_email BOOLEAN,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario)
);

CREATE TABLE Programa_Universitario (
    id_programa INT AUTO_INCREMENT PRIMARY KEY,
    id_universidad INT,
    id_carrera_base INT,
    semestres INT,
    arancel VARCHAR(50),
    empleabilidad_pct INT,
    ingresados_anual INT,
    egresados_anual INT,
    sueldo_promedio_1er_ano INT,
    sueldo_promedio_2do_ano INT,
    FOREIGN KEY (id_universidad) REFERENCES Universidad(id_universidad),
    FOREIGN KEY (id_carrera_base) REFERENCES Carrera_Base(id_carrera_base)
);

-- 3. Tablas de Segundo Nivel de Dependencia (Relaciones y Requisitos)
CREATE TABLE Requisitos_Programa (
    id_programa INT PRIMARY KEY,
    pct_nem INT,
    pct_ranking INT,
    pct_m1 INT,
    pct_m2 INT,
    pct_lectora INT,
    pct_ciencias_historia INT,
    pct_corte INT,
    FOREIGN KEY (id_programa) REFERENCES Programa_Universitario(id_programa)
);

CREATE TABLE Usuario_Universidad (
    id_usuario INT,
    id_universidad INT,
    fecha_inicio DATE,
    PRIMARY KEY (id_usuario, id_universidad),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_universidad) REFERENCES Universidad(id_universidad)
);

CREATE TABLE Usuario_Programa (
    id_usuario INT,
    id_programa INT,
    validado BOOLEAN,
    PRIMARY KEY (id_usuario, id_programa),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_programa) REFERENCES Programa_Universitario(id_programa)
);

CREATE TABLE Hilo (
    id_hilo INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(150),
    contenido TEXT,
    fecha_publicacion DATETIME,
    likes INT,
    dislikes INT,
    id_usuario INT,
    id_programa INT,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (id_programa) REFERENCES Programa_Universitario(id_programa)
);

-- 4. Tablas de Tercer Nivel (Dependen de Hilos y otros Comentarios)
CREATE TABLE Comentario (
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    id_hilo INT,
    id_usuario INT,
    parent_comentario_id INT,
    contenido TEXT,
    fecha_publicacion DATETIME,
    likes INT,
    dislikes INT,
    FOREIGN KEY (id_hilo) REFERENCES Hilo(id_hilo),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (parent_comentario_id) REFERENCES Comentario(id_comentario)
);