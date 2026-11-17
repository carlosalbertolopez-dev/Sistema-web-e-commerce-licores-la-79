-- PostgreSQL 14+
-- Crear BD:
-- CREATE DATABASE licores79;
-- \c licores79

CREATE EXTENSION IF NOT EXISTS citext;

-- =====================================================
-- USUARIO DE LA APLICACIÓN
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_roles
    WHERE rolname = 'l79_app'
  ) THEN

    CREATE ROLE l79_app
    LOGIN
    PASSWORD 'CAMBIAR_ESTA_CLAVE_LARGA';

  END IF;
END
$$;

-- =====================================================
-- USUARIOS
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id BIGSERIAL PRIMARY KEY,

  nombre_completo VARCHAR(120) NOT NULL,

  email CITEXT NOT NULL UNIQUE,

  telefono VARCHAR(20) NOT NULL,

  fecha_nacimiento DATE NOT NULL
  CHECK (
    fecha_nacimiento <= CURRENT_DATE - INTERVAL '18 years'
  ),

  password_hash TEXT NOT NULL,

  rol VARCHAR(10) NOT NULL DEFAULT 'cliente'
  CHECK (
    rol IN ('cliente', 'admin')
  ),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- CATEGORÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS categorias (
  id INTEGER PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================
-- SUBCATEGORÍAS
-- =====================================================

CREATE TABLE IF NOT EXISTS subcategorias (
  id INTEGER PRIMARY KEY,

  nombre VARCHAR(100) NOT NULL,

  categoria_id INTEGER NOT NULL
  REFERENCES categorias(id)
  ON DELETE RESTRICT
);

-- =====================================================
-- PRODUCTOS
-- =====================================================

CREATE TABLE IF NOT EXISTS productos (

  id BIGSERIAL PRIMARY KEY,

  sku VARCHAR(100) NOT NULL UNIQUE,

  nombre VARCHAR(200) NOT NULL,

  categoria VARCHAR(60) NOT NULL,

  categoria_id INTEGER
  REFERENCES categorias(id),

  subcategoria_id INTEGER
  REFERENCES subcategorias(id),

  precio_cop INTEGER NOT NULL
  CHECK (precio_cop >= 0),

  imagen VARCHAR(255),

  stock INTEGER NOT NULL DEFAULT 0
  CHECK (stock >= 0),

  activo BOOLEAN NOT NULL DEFAULT TRUE,

  descripcion TEXT
);

CREATE INDEX IF NOT EXISTS idx_productos_categoria
ON productos(categoria_id);

CREATE INDEX IF NOT EXISTS idx_productos_subcategoria
ON productos(subcategoria_id);

-- =====================================================
-- PEDIDOS
-- =====================================================

CREATE TABLE IF NOT EXISTS pedidos (

  id BIGSERIAL PRIMARY KEY,

  usuario_id BIGINT NOT NULL
  REFERENCES usuarios(id),

  estado VARCHAR(15) NOT NULL DEFAULT 'pendiente'
  CHECK (
    estado IN (
      'pendiente',
      'en_camino',
      'entregado',
      'cancelado'
    )
  ),

  total_cop INTEGER NOT NULL
  CHECK (total_cop >= 0),

  direccion VARCHAR(200) NOT NULL,

  metodo_pago VARCHAR(15) NOT NULL
  CHECK (
    metodo_pago IN (
      'contraentrega',
      'pse',
      'tarjeta'
    )
  ),

  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario
ON pedidos(usuario_id);

-- =====================================================
-- ITEMS DEL PEDIDO
-- =====================================================

CREATE TABLE IF NOT EXISTS pedido_items (

  pedido_id BIGINT NOT NULL
  REFERENCES pedidos(id)
  ON DELETE CASCADE,

  producto_id BIGINT NOT NULL
  REFERENCES productos(id),

  cantidad INTEGER NOT NULL
  CHECK (
    cantidad BETWEEN 1 AND 20
  ),

  precio_unitario INTEGER NOT NULL
  CHECK (
    precio_unitario >= 0
  ),

  PRIMARY KEY (
    pedido_id,
    producto_id
  )
);

-- =====================================================
-- SUSCRIPTORES
-- =====================================================

CREATE TABLE IF NOT EXISTS suscriptores (

  email CITEXT PRIMARY KEY,

  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DATOS INICIALES CATEGORÍAS
-- =====================================================

INSERT INTO categorias (id, nombre)
VALUES
  (1, 'Cerveza'),
  (6, 'Tequila'),
  (7, 'Whisky'),
  (10, 'Otros Licores')
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- DATOS INICIALES SUBCATEGORÍAS
-- =====================================================

INSERT INTO subcategorias (
  id,
  nombre,
  categoria_id
)
VALUES

-- Cerveza
(1, 'Importada', 1),
(2, 'Nacional', 1),
(3, 'Artesanal', 1),

-- Tequila
(4, 'Blanco', 6),
(5, 'Reposado', 6),
(6, 'Añejo', 6),

-- Whisky
(7, 'Escocés', 7),
(8, 'Americano', 7),
(9, 'Canadiense', 7),

-- Otros licores
(10, 'Ron', 10),
(11, 'Vodka', 10),
(12, 'Ginebra', 10),
(13, 'Cremas', 10),
(14, 'Cognac', 10),
(15, 'Brandy', 10),
(16, 'Aguardiente', 10)

ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- PERMISOS
-- =====================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC;

GRANT SELECT, INSERT
ON usuarios,
   pedidos,
   pedido_items,
   suscriptores
TO l79_app;

GRANT SELECT,
      UPDATE (stock)
ON productos
TO l79_app;

GRANT SELECT
ON categorias
TO l79_app;

GRANT SELECT
ON subcategorias
TO l79_app;

GRANT USAGE
ON ALL SEQUENCES IN SCHEMA public
TO l79_app;