PRAGMA foreign_keys = ON;

-- =========================
-- TABLA USUARIOS (AUTH)
-- =========================
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin','profesor','estudiante')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  must_change_password INTEGER DEFAULT 1,
  activo INTEGER DEFAULT 1
);

-- =========================
-- TELEGRAM
-- =========================
CREATE TABLE IF NOT EXISTS telegram_vinculaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_entidad TEXT NOT NULL CHECK(tipo_entidad IN ('usuario','representante')),
  id_entidad INTEGER NOT NULL,
  chat_id TEXT NOT NULL UNIQUE,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tipo_entidad, id_entidad)
);

CREATE TABLE IF NOT EXISTS telegram_codigos_vinculacion (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo_entidad TEXT NOT NULL CHECK(tipo_entidad IN ('usuario','representante')),
  id_entidad INTEGER NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  expira_at TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tipo_entidad, id_entidad)
);

CREATE TABLE IF NOT EXISTS periodos_escolares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,        -- ej: '2024-2025'
  fecha_inicio DATE,
  fecha_fin DATE,
  activo INTEGER DEFAULT 0,           -- solo 1 activo a la vez
  cerrado INTEGER DEFAULT 0,          -- cuando admin cierra el año
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fases_periodo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_periodo INTEGER NOT NULL,
  fase TEXT NOT NULL CHECK(fase IN ('finalizacion','revision','revision_especial','pendiente_oct','pendiente_dic','pendiente_ene','pendiente_jun')),
  abierta INTEGER DEFAULT 1,
  cerrada_at DATETIME DEFAULT NULL,
  UNIQUE(id_periodo, fase),
  FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id)
);

-- =========================
-- ESTUDIANTES
-- =========================
CREATE TABLE IF NOT EXISTS estudiantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula INTEGER NOT NULL UNIQUE,
  correo TEXT UNIQUE,
  telefono TEXT UNIQUE,
  lugar_nacimiento TEXT,
  entidad_federal TEXT,
  id_usuario INTEGER UNIQUE,
  egresado INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) -- ON DELETE SET NULL
);

-- =========================
-- PROFESORES
-- =========================
CREATE TABLE IF NOT EXISTS profesores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula INTEGER NOT NULL UNIQUE,
  correo TEXT UNIQUE,
  telefono TEXT UNIQUE,
  direccion TEXT,
  id_usuario INTEGER UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) -- ON DELETE SET NULL
);

-- =========================
-- ADMINISTRADORES
-- =========================
CREATE TABLE IF NOT EXISTS administradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula INTEGER NOT NULL UNIQUE,
  correo TEXT UNIQUE,
  telefono TEXT UNIQUE,
  direccion TEXT,
  id_usuario INTEGER UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) --ON DELETE SET NULL
);

-- =========================
-- GRADOS
-- =========================
CREATE TABLE IF NOT EXISTS grados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anio INTEGER NOT NULL,
  seccion TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(anio, seccion)
);

-- =========================
-- ASIGNATURAS
-- =========================
CREATE TABLE IF NOT EXISTS asignaturas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- GRADO - ASIGNATURA (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS rel_grado_asignatura (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_grado INTEGER NOT NULL,
  id_asignatura INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE(id_grado, id_asignatura),
  FOREIGN KEY (id_grado) REFERENCES grados(id) --ON DELETE CASCADE,
  FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id) -- ON DELETE CASCADE
);

-- =========================
-- ESTUDIANTE - GRADO (N:M)
-- =========================


CREATE TABLE IF NOT EXISTS anio_asignatura_template (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anio INTEGER NOT NULL,
  id_asignatura INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(anio, id_asignatura),
  FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id)
);



CREATE TABLE IF NOT EXISTS rel_estudiante_grado (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_estudiante INTEGER NOT NULL,
  id_grado INTEGER NOT NULL,
  activo INTEGER DEFAULT 1,
  id_periodo INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id), --ON DELETE CASCADE,
  FOREIGN KEY (id_grado) REFERENCES grados(id), --ON DELETE CASCADE
  FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id)
);


CREATE TABLE IF NOT EXISTS estudiante_asignatura_pendiente (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_estudiante INTEGER NOT NULL,
  id_asignatura INTEGER NOT NULL,
  id_grado_origen INTEGER NOT NULL,
  aprobada INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  id_periodo INTEGER NOT NULL,
  fase TEXT CHECK(fase IN ('revision','pendiente_oct','pendiente_dic','pendiente_ene','pendiente_jun')),
  nota_obtenida REAL DEFAULT NULL,
  aprobada_en_fase TEXT DEFAULT NULL,
  inasistente INTEGER NOT NULL DEFAULT 0,
  revision_inicial TEXT DEFAULT NULL,
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id),
  FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id),
  FOREIGN KEY (id_grado_origen) REFERENCES grados(id),
  FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id),
  UNIQUE(id_estudiante, id_asignatura, id_grado_origen, id_periodo, fase)
);

-- =========================
-- ASIGNATURA - PROFESOR (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS rel_asignatura_profesor (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_rel_grado_asignatura INTEGER NOT NULL,
  id_profesor INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE(id_rel_grado_asignatura, id_profesor),
  FOREIGN KEY (id_rel_grado_asignatura) REFERENCES rel_grado_asignatura(id), --ON DELETE CASCADE,
  FOREIGN KEY (id_profesor) REFERENCES profesores(id) --ON DELETE CASCADE
);

-- =========================
-- PROFESOR - ASIGNATURA (HABILITACIÓN)
-- =========================
CREATE TABLE IF NOT EXISTS rel_profesor_asignatura (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_profesor INTEGER NOT NULL,
  id_asignatura INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE(id_profesor, id_asignatura),
  FOREIGN KEY (id_profesor) REFERENCES profesores(id),
  FOREIGN KEY (id_asignatura) REFERENCES asignaturas(id)
);

CREATE TABLE IF NOT EXISTS estados_estudiante_periodo (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_estudiante INTEGER NOT NULL,
  id_grado INTEGER NOT NULL,
  id_periodo INTEGER NOT NULL,
  estado TEXT NOT NULL CHECK(estado IN (
    'cursando',
    'aprobado',
    'revision',
    'pendiente',      -- máx 2 materias, avanza de año
    'reprobado'       -- +2 materias después de revisión
  )),
  UNIQUE(id_estudiante, id_periodo),
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id),
  FOREIGN KEY (id_grado) REFERENCES grados(id),
  FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id)
);
-- =========================
-- LAPSOS
-- =========================
CREATE TABLE lapsos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero INTEGER NOT NULL UNIQUE
);


INSERT OR IGNORE INTO lapsos (numero) VALUES (1), (2), (3);
-- =========================
-- NOTAS
-- =========================
CREATE TABLE notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_rel_estudiante_grado INTEGER NOT NULL,
  id_rel_grado_asignatura INTEGER NOT NULL,
  id_lapso INTEGER NOT NULL,
  nota REAL,
  inasistente INTEGER NOT NULL DEFAULT 0,
  id_periodo INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(id_rel_estudiante_grado, id_rel_grado_asignatura, id_lapso),
  CHECK ((inasistente = 1 AND nota IS NULL) OR (inasistente = 0 AND nota IS NOT NULL)),
  FOREIGN KEY (id_periodo) REFERENCES periodos_escolares(id),
  FOREIGN KEY (id_rel_estudiante_grado) REFERENCES rel_estudiante_grado(id),
  FOREIGN KEY (id_rel_grado_asignatura) REFERENCES rel_grado_asignatura(id),
  FOREIGN KEY (id_lapso) REFERENCES lapsos(id)
);

-- =========================
-- REPRESENTANTES
-- =========================
CREATE TABLE IF NOT EXISTS representantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cedula INTEGER NOT NULL UNIQUE,
  correo TEXT UNIQUE,
  telefono TEXT UNIQUE, 
  direccion TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL
);

-- =========================
-- ESTUDIANTE - REPRESENTANTE (N:M)
-- =========================
CREATE TABLE IF NOT EXISTS rel_estudiante_representante (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_estudiante INTEGER NOT NULL,
  id_representante INTEGER NOT NULL,
  parentesco TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME DEFAULT NULL,
  UNIQUE(id_estudiante, id_representante),
  FOREIGN KEY (id_estudiante) REFERENCES estudiantes(id) --ON DELETE CASCADE,
  FOREIGN KEY (id_representante) REFERENCES representantes(id) --ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_cedula_ins
BEFORE INSERT ON estudiantes
WHEN NEW.cedula IS NOT NULL AND (
  EXISTS (SELECT 1 FROM profesores 
          WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_cedula_upd
BEFORE UPDATE OF cedula ON estudiantes
WHEN NEW.cedula IS NOT NULL
  AND NEW.cedula <> OLD.cedula
  AND (
    EXISTS (SELECT 1 FROM profesores 
            WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_correo_ins
BEFORE INSERT ON estudiantes
WHEN NEW.correo IS NOT NULL AND (
  EXISTS (SELECT 1 FROM profesores 
          WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_correo_upd
BEFORE UPDATE OF correo ON estudiantes
WHEN NEW.correo IS NOT NULL
  AND NEW.correo <> OLD.correo
  AND (
    EXISTS (SELECT 1 FROM profesores 
            WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_tel_ins
BEFORE INSERT ON estudiantes
WHEN NEW.telefono IS NOT NULL AND (
  EXISTS (SELECT 1 FROM profesores 
          WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_estudiantes_tel_upd
BEFORE UPDATE OF telefono ON estudiantes
WHEN NEW.telefono IS NOT NULL
  AND NEW.telefono <> OLD.telefono
  AND (
    EXISTS (SELECT 1 FROM profesores 
            WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_profesores_cedula_ins
BEFORE INSERT ON profesores
WHEN NEW.cedula IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_profesores_cedula_upd
BEFORE UPDATE OF cedula ON profesores
WHEN NEW.cedula IS NOT NULL
  AND NEW.cedula <> OLD.cedula
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_profesores_correo_ins
BEFORE INSERT ON profesores
WHEN NEW.correo IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_profesores_correo_upd
BEFORE UPDATE OF correo ON profesores
WHEN NEW.correo IS NOT NULL
  AND NEW.correo <> OLD.correo
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_profesores_tel_ins
BEFORE INSERT ON profesores
WHEN NEW.telefono IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_profesores_tel_upd
BEFORE UPDATE OF telefono ON profesores
WHEN NEW.telefono IS NOT NULL
  AND NEW.telefono <> OLD.telefono
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_admin_cedula_ins
BEFORE INSERT ON administradores
WHEN NEW.cedula IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;


CREATE TRIGGER IF NOT EXISTS trg_admin_cedula_upd
BEFORE UPDATE OF cedula ON administradores
WHEN NEW.cedula IS NOT NULL
  AND NEW.cedula <> OLD.cedula
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;

-- =========================
-- ADMINISTRADORES (correo)
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_admin_correo_ins
BEFORE INSERT ON administradores
WHEN NEW.correo IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_admin_correo_upd
BEFORE UPDATE OF correo ON administradores
WHEN NEW.correo IS NOT NULL
  AND NEW.correo <> OLD.correo
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

-- =========================
-- ADMINISTRADORES (telefono)
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_admin_tel_ins
BEFORE INSERT ON administradores
WHEN NEW.telefono IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM representantes 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_admin_tel_upd
BEFORE UPDATE OF telefono ON administradores
WHEN NEW.telefono IS NOT NULL
  AND NEW.telefono <> OLD.telefono
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM representantes 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

-- =========================
-- REPRESENTANTES (cedula)
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_repr_cedula_ins
BEFORE INSERT ON representantes
WHEN NEW.cedula IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE cedula = NEW.cedula AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_repr_cedula_upd
BEFORE UPDATE OF cedula ON representantes
WHEN NEW.cedula IS NOT NULL
  AND NEW.cedula <> OLD.cedula
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE cedula = NEW.cedula AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CEDULA_DUPLICADA_GLOBAL');
END;

-- =========================
-- REPRESENTANTES (correo)
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_repr_correo_ins
BEFORE INSERT ON representantes
WHEN NEW.correo IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE correo = NEW.correo AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_repr_correo_upd
BEFORE UPDATE OF correo ON representantes
WHEN NEW.correo IS NOT NULL
  AND NEW.correo <> OLD.correo
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE correo = NEW.correo AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'CORREO_DUPLICADO_GLOBAL');
END;

-- =========================
-- REPRESENTANTES (telefono)
-- =========================
CREATE TRIGGER IF NOT EXISTS trg_repr_tel_ins
BEFORE INSERT ON representantes
WHEN NEW.telefono IS NOT NULL AND (
  EXISTS (SELECT 1 FROM estudiantes 
          WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM profesores 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  OR EXISTS (SELECT 1 FROM administradores 
             WHERE telefono = NEW.telefono AND deleted_at IS NULL)
)
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

CREATE TRIGGER IF NOT EXISTS trg_repr_tel_upd
BEFORE UPDATE OF telefono ON representantes
WHEN NEW.telefono IS NOT NULL
  AND NEW.telefono <> OLD.telefono
  AND (
    EXISTS (SELECT 1 FROM estudiantes 
            WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM profesores 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
    OR EXISTS (SELECT 1 FROM administradores 
               WHERE telefono = NEW.telefono AND deleted_at IS NULL)
  )
BEGIN
  SELECT RAISE(ABORT, 'TELEFONO_DUPLICADO_GLOBAL');
END;

-- =========================
-- ÍNDICES FALTANTES
-- =========================
CREATE INDEX IF NOT EXISTS idx_fases_periodo
ON fases_periodo(id_periodo, fase, abierta);

CREATE INDEX IF NOT EXISTS idx_estado_estudiante_periodo
ON estados_estudiante_periodo(id_periodo, estado);

CREATE INDEX IF NOT EXISTS idx_estado_por_grado
ON estados_estudiante_periodo(id_grado, id_periodo);

CREATE INDEX IF NOT EXISTS idx_telegram_codigo
ON telegram_codigos_vinculacion(codigo, expira_at);

CREATE INDEX IF NOT EXISTS idx_estudiantes_correo_activo
ON estudiantes(correo) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_estudiantes_tel_activo
ON estudiantes(telefono) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profesores_correo_activo
ON profesores(correo) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profesores_tel_activo
ON profesores(telefono) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_correo_activo
ON administradores(correo) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_tel_activo
ON administradores(telefono) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_repr_correo_activo
ON representantes(correo) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_repr_tel_activo
ON representantes(telefono) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_estudiantes_cedula_activa
ON estudiantes(cedula) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_profesores_cedula_activa
ON profesores(cedula) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_cedula_activa
ON administradores(cedula) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_repr_cedula_activa
ON representantes(cedula) WHERE deleted_at IS NULL;


CREATE INDEX idx_notas_full
ON notas(id_rel_estudiante_grado, id_rel_grado_asignatura, id_lapso);
