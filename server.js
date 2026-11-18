'use strict';
require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const { Pool } = require('pg');
const axios = require('axios');
const transporter = require('./config/mailer');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('Define JWT_SECRET (mín. 32 caracteres) en .env');
const prod = process.env.NODE_ENV === 'production';
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: prod ? { rejectUnauthorized: true } : false, max: 10 });
const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],

        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://code.jquery.com",
          "https://cdn.jsdelivr.net"
        ],

        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdnjs.cloudflare.com",
          "https://fonts.googleapis.com"
        ],

        fontSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://fonts.googleapis.com",
          "https://use.fontawesome.com",
          "https://cdnjs.cloudflare.com",
          "https://fonts.gstatic.com"
        ],

        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "http:"
        ],

        connectSrc: [
          "'self'"
        ],

        objectSrc: [
          "'none'"
        ],

        frameAncestors: [
          "'none'"
        ]
      }
    }
  })
);

app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

// CSRF: cookie SameSite=Strict + cabecera personalizada obligatoria en peticiones que modifican datos
app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method) && req.get('x-requested-with') !== 'fetch') return res.status(403).json({ error: 'Petición no permitida.' });
  next();
});

const limiteGeneral = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false });
const limiteAuth = rateLimit({ windowMs: 15 * 60_000, limit: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiados intentos. Intenta en 15 minutos.' } });
app.use('/api', limiteGeneral);

// ---------- Sesión ----------

const cookieOpts = {
  httpOnly: true,
  secure: prod,
  sameSite: 'strict',
  maxAge: 2 * 60 * 60 * 1000,
  path: '/'
};

const setSession = (res, u) =>
  res.cookie(
    'l79_session',
    jwt.sign(
      {
        sub: u.id,
        rol: u.rol,
        nombre: u.nombre_completo
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '2h',
        algorithm: 'HS256'
      }
    ),
    cookieOpts
  );

function auth(req, res, next) {

  try {

    req.user = jwt.verify(
      req.cookies.l79_session,
      process.env.JWT_SECRET,
      {
        algorithms: ['HS256']
      }
    );

    next();

  } catch {

    res.status(401).json({
      error: 'Inicia sesión para continuar.'
    });

  }

}

function soloAdmin(req, res, next) {

  if (req.user.rol !== 'admin') {

    return res.status(403).json({
      error: 'Acceso denegado'
    });

  }

  next();

}

// ---------- Validación ----------
const edad = (f) => { const d = new Date(f), h = new Date(); let a = h.getFullYear() - d.getFullYear(); if (h < new Date(h.getFullYear(), d.getMonth(), d.getDate())) a--; return a; };
const registroSch = z.object({

  nombre_completo: z
    .string()
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(120, 'El nombre es demasiado largo')
    .regex(
      /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/,
      'Solo se permiten letras y espacios'
    ),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico inválido')
    .max(254),

  telefono: z
    .string()
    .trim()
    .regex(
      /^[0-9]{10}$/,
      'El teléfono debe tener 10 dígitos'
    ),

  fecha_nacimiento: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}$/,
      'Fecha inválida'
    )
    .refine(
      f => edad(f) >= 18,
      'Debes ser mayor de 18 años'
    ),

  contrasena: z
    .string()
    .min(8, 'La contraseña debe tener mínimo 8 caracteres')
    .max(72)

});
const loginSch = z.object({ email: z.string().trim().toLowerCase().email(), contrasena: z.string().min(1).max(72) });
const pedidoSch = z.object({
  items: z.array(z.object({ sku: z.string().max(100), cantidad: z.number().int().min(1).max(20) })).min(1).max(50),
  direccion: z.string().trim().min(8, 'Escribe una dirección completa').max(200),
  metodo_pago: z.enum(['contraentrega', 'pse', 'tarjeta']),
  mayor_edad: z.literal(true, { errorMap: () => ({ message: 'Debes confirmar que eres mayor de edad.' }) })
});
const validar = (sch) => (req, res, next) => {
  const r = sch.safeParse(req.body);
  if (!r.success) return res.status(400).json({ error: r.error.issues[0].message });
  req.data = r.data; next();
};

// ---------- Rutas ----------
const DUMMY = bcrypt.hashSync('relleno-contra-timing', 12);

app.post('/api/auth/registro', limiteAuth, validar(registroSch), async (req, res, next) => {
  try {
    const d = req.data, hash = await bcrypt.hash(d.contrasena, 12);
    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre_completo,email,telefono,fecha_nacimiento,password_hash) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (email) DO NOTHING RETURNING id,rol,nombre_completo`,
      [d.nombre_completo, d.email, d.telefono, d.fecha_nacimiento, hash]);
    if (!rows.length) return res.status(409).json({ error: 'No se pudo crear la cuenta con esos datos.' });
    setSession(res, rows[0]); res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

app.post('/api/auth/login', limiteAuth, validar(loginSch), async (req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT id,rol,nombre_completo,password_hash FROM usuarios WHERE email=$1', [req.data.email]);
    const ok = await bcrypt.compare(req.data.contrasena, rows[0]?.password_hash || DUMMY);
    if (!rows.length || !ok) return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
    setSession(res, rows[0]); res.json({ ok: true });
  } catch (e) { next(e); }
});

app.post('/api/auth/logout', (req, res) => { res.clearCookie('l79_session', { ...cookieOpts, maxAge: undefined }); res.json({ ok: true }); });
app.get('/api/auth/me', auth, (req, res) => {

  res.json({
    id: req.user.sub,
    nombre: req.user.nombre,
    rol: req.user.rol
  });

});
app.get('/api/productos', async (req, res, next) => {
  try {

    const result = await pool.query(`
      SELECT
        p.sku,
        p.nombre,
        p.categoria,
        s.nombre AS subcategoria,
        p.precio_cop,
        p.imagen,
        p.stock
      FROM productos p
      LEFT JOIN subcategorias s
        ON p.subcategoria_id = s.id
      WHERE p.activo = true
      ORDER BY p.nombre
    `);

    res.json(result.rows);

  } catch (e) {

    console.error(e);

    res.status(500).json({
      error: e.message
    });

  }
});

app.get('/api/productos/buscar/:texto', async (req, res, next) => {
  try {

    const { texto } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.sku,
        p.nombre,
        p.categoria,
        s.nombre AS subcategoria,
        p.precio_cop,
        p.imagen,
        p.stock
      FROM productos p
      LEFT JOIN subcategorias s
        ON p.subcategoria_id = s.id
      WHERE p.activo = true
      AND (
        LOWER(p.nombre) LIKE LOWER($1)
        OR LOWER(p.categoria) LIKE LOWER($1)
        OR LOWER(COALESCE(s.nombre, '')) LIKE LOWER($1)
      )
      ORDER BY p.nombre
      `,
      [`%${texto}%`]
    );

    res.json(result.rows);

  } catch (e) {
    next(e);
  }
});

app.get('/api/productos-relacionados/:categoria/:sku', async (req, res, next) => {
  try {

    const { categoria, sku } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.sku,
        p.nombre,
        p.categoria,
        s.nombre AS subcategoria,
        p.precio_cop,
        p.imagen
      FROM productos p
      LEFT JOIN subcategorias s
        ON p.subcategoria_id = s.id
      WHERE p.activo = true
      AND p.categoria = $1
      AND p.sku <> $2
      LIMIT 4
      `,
      [categoria, sku]
    );

    res.json(result.rows);

  } catch (e) {
    next(e);
  }
});

app.get('/api/productos/:sku', async (req, res, next) => {
  try {

    const { sku } = req.params;

    const result = await pool.query(
      `
      SELECT
        p.sku,
        p.nombre,
        p.categoria,
        s.nombre AS subcategoria,
        p.precio_cop,
        p.imagen,
        p.stock,
        p.descripcion
      FROM productos p
      LEFT JOIN subcategorias s
        ON p.subcategoria_id = s.id
      WHERE p.sku = $1
      AND p.activo = true
      `,
      [sku]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        error: 'Producto no encontrado'
      });
    }

    res.json(result.rows[0]);

  } catch (e) {
    next(e);
  }
});

app.post('/api/pedidos', auth, validar(pedidoSch), async (req, res, next) => {
  const c = await pool.connect();
  try {
    const pedido = new Map();
    req.data.items.forEach((i) => pedido.set(i.sku, Math.min(20, (pedido.get(i.sku) || 0) + i.cantidad)));
    await c.query('BEGIN');
    const { rows: ps } = await c.query('SELECT id,sku,nombre,precio_cop,stock FROM productos WHERE sku = ANY($1) AND activo FOR UPDATE', [[...pedido.keys()]]);
    if (ps.length !== pedido.size) { await c.query('ROLLBACK'); return res.status(400).json({ error: 'Algún producto ya no está disponible.' }); }
    let total = 0;
    for (const p of ps) {
      const q = pedido.get(p.sku);
      if (q > p.stock) { await c.query('ROLLBACK'); return res.status(409).json({ error: `Sin stock suficiente de ${p.nombre}.` }); }
      total += p.precio_cop * q;
    }
    const { rows: [ped] } = await c.query('INSERT INTO pedidos (usuario_id,total_cop,direccion,metodo_pago) VALUES ($1,$2,$3,$4) RETURNING id',
      [req.user.sub, total, req.data.direccion, req.data.metodo_pago]);
    for (const p of ps) {
      const q = pedido.get(p.sku);
      await c.query('INSERT INTO pedido_items (pedido_id,producto_id,cantidad,precio_unitario) VALUES ($1,$2,$3,$4)', [ped.id, p.id, q, p.precio_cop]);
      await c.query('UPDATE productos SET stock = stock - $1 WHERE id=$2', [q, p.id]);
    }
    await c.query('COMMIT');
    res.status(201).json({ pedido_id: ped.id, total });
  } catch (e) { await c.query('ROLLBACK').catch(() => { }); next(e); } finally { c.release(); }
});

app.get('/api/pedidos', auth, async (req, res, next) => {
  try { res.json((await pool.query('SELECT id,estado,total_cop,creado_en FROM pedidos WHERE usuario_id=$1 ORDER BY id DESC LIMIT 50', [req.user.sub])).rows); }
  catch (e) { next(e); }
});

// ---------- Búsqueda de Barrios en Cali de forma dinámica y gratuita ----------
app.get('/api/buscar-barrios', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query) return res.json([]);

    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${query}, Cali, Valle del Cauca, Colombia`,
        format: 'json',
        addressdetails: 1,
        limit: 5
      },
      headers: {
        'User-Agent': 'LicoresLa79App/1.0 (contacto@licoresla79.com)'
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      return res.json([]);
    }

    const barriosSet = new Set();
    response.data.forEach(item => {
      const addr = item.address || {};
      const nombreBarrio = addr.suburb || addr.neighbourhood || addr.residential || item.display_name.split(',')[0];
      if (nombreBarrio) barriosSet.add(nombreBarrio);
    });

    res.json(Array.from(barriosSet));
  } catch (error) {
    console.error('Error buscando barrios:', error.message);
    res.json([]);
  }
});

app.post('/api/suscribir',
  limiteAuth,
  validar(
    z.object({
      nombre: z.string().trim().min(2).max(100),
      email: z.string().trim().toLowerCase().email().max(254)
    })
  ),
  async (req, res, next) => {
    try {
      const nombre = req.data.nombre;
      const email = req.data.email;

      await pool.query(
        'INSERT INTO suscriptores (email) VALUES ($1) ON CONFLICT DO NOTHING',
        [email]
      );

      await transporter.sendMail({
        from: `"Licores La 79" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: '🍾 ¡Bienvenido a Licores La 79! Ya haces parte de nuestra comunidad',
        html: `
<div style="margin:0; padding:40px 15px; background:#f4f4f4; font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:15px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,.08);">
          <tr>
            <td align="center" style="background:#111111; padding:45px 20px;">
              <h1 style="margin:0; color:#D9B04A; font-size:38px;">🍾 Licores La 79</h1>
              <p style="margin:15px 0 0 0; color:#ffffff; font-size:16px;">La mejor selección de licores en Cali</p>
            </td>
          </tr>
          <tr>
            <td style="padding:45px; color:#333333;">
              <h2 style="color:#D9B04A; margin-top:0; font-size:32px;">🎉 ¡Hola ${nombre}!</h2>
              <p style="font-size:17px; line-height:1.8;">Gracias por suscribirte a <strong>Licores La 79</strong>.</p>
              <p style="font-size:16px; line-height:1.8;">Estamos felices de tenerte en nuestra comunidad.</p>
              <p style="font-size:16px; line-height:1.8;">A partir de este momento recibirás información exclusiva sobre:</p>
              <table width="100%" style="margin-top:20px;">
                <tr><td style="padding:8px 0;">🎁 Promociones exclusivas</td></tr>
                <tr><td style="padding:8px 0;">🥃 Nuevos productos y marcas</td></tr>
                <tr><td style="padding:8px 0;">🍺 Ofertas especiales</td></tr>
                <tr><td style="padding:8px 0;">🚚 Información sobre domicilios</td></tr>
                <tr><td style="padding:8px 0;">📢 Eventos y novedades</td></tr>
              </table>
              <div style="margin:30px 0; background:#FFF8DD; border-left:5px solid #D9B04A; padding:20px; border-radius:5px;">
                <strong>💡 Consejo</strong><br><br>Guarda este correo entre tus contactos para asegurarte de recibir nuestras promociones y novedades.
              </div>
            </td>
          </tr>
          <tr>
            <td style="background:#111111; text-align:center; padding:30px;">
              <h3 style="color:#D9B04A; margin:0;">Licores La 79</h3>
              <p style="color:#ffffff; margin:12px 0;">Cali, Colombia</p>
              <p style="color:#aaaaaa; font-size:13px; line-height:1.6;">Has recibido este correo porque te suscribiste voluntariamente a nuestras promociones y novedades.</p>
              <hr style="border:none; border-top:1px solid #333333; margin:20px 0;">
              <p style="color:#D9B04A; font-weight:bold; margin-bottom:10px;">Síguenos en nuestras redes</p>
              <p style="color:#ffffff; line-height:1.8;">
                📸 <a href="https://instagram.com/guille_licoresla79" style="color:#D9B04A;">Instagram</a><br>
                📘 <a href="https://www.facebook.com/guillermo.murillo.854110" style="color:#D9B04A;">Facebook</a><br>
                🎵 <a href="https://www.tiktok.com/@licoresla79" style="color:#D9B04A;">TikTok</a>
              </p>
              <p style="color:#888888; font-size:12px; margin:0;">© 2026 Licores La 79. Todos los derechos reservados.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</div>
`
      });
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/subcategoria/:nombre', async (req, res, next) => {
    try {  
      const { nombre } = req.params;  
      const result = await pool.query(
        `
        SELECT
          p.sku,
          p.nombre,
          p.categoria,
          s.nombre AS subcategoria,
          p.precio_cop,
          p.imagen,
          p.stock
        FROM productos p
        LEFT JOIN subcategorias s
          ON p.subcategoria_id = s.id
        WHERE p.activo = true
        AND LOWER(s.nombre) = LOWER($1)
        ORDER BY p.nombre
        `,
        [nombre]
      );
  
      res.json(result.rows);
  
    } catch (e) {
      next(e);
    }
  });  

  app.get('/api/mas-vendidos', async (req, res, next) => {
    try {
  
      const result = await pool.query(`
        SELECT
          p.sku,
          p.nombre,
          p.categoria,
          s.nombre AS subcategoria,
          p.precio_cop,
          p.imagen,
          p.stock,
          SUM(pi.cantidad) AS total_vendido
        FROM productos p
        INNER JOIN pedido_items pi
          ON p.id = pi.producto_id
        LEFT JOIN subcategorias s
          ON p.subcategoria_id = s.id
        WHERE p.activo = true
        GROUP BY
          p.id,
          p.sku,
          p.nombre,
          p.categoria,
          s.nombre,
          p.precio_cop,
          p.imagen,
          p.stock
        ORDER BY total_vendido DESC
        LIMIT 12
      `);
  
      res.json(result.rows);
  
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/mas-vendidos/todos', async (req, res, next) => {
    try {
  
      const result = await pool.query(`
        SELECT
          p.sku,
          p.nombre,
          p.categoria,
          s.nombre AS subcategoria,
          p.precio_cop,
          p.imagen,
          p.stock,
          SUM(pi.cantidad) AS total_vendido
        FROM productos p
        INNER JOIN pedido_items pi
          ON p.id = pi.producto_id
        LEFT JOIN subcategorias s
          ON p.subcategoria_id = s.id
        WHERE p.activo = true
        GROUP BY
          p.id,
          p.sku,
          p.nombre,
          p.categoria,
          s.nombre,
          p.precio_cop,
          p.imagen,
          p.stock
        ORDER BY total_vendido DESC
      `);
  
      res.json(result.rows);
  
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/admin/pedidos',
    auth,
    soloAdmin, async (req, res, next) => {
    try {
  
      const result = await pool.query(`
        SELECT
          p.id,
          u.nombre_completo,
          u.email,
          u.telefono,
          p.total_cop,
          p.estado,
          p.direccion,
          p.metodo_pago,
          p.creado_en
        FROM pedidos p
        INNER JOIN usuarios u
          ON p.usuario_id = u.id
        ORDER BY p.creado_en DESC
      `);
  
      res.json(result.rows);
  
    } catch (e) {
      next(e);
    }
  });

  app.get('/api/admin/pedidos/:id',
    auth,
    soloAdmin, async (req, res, next) => {
    try {
  
      const { id } = req.params;
  
      const result = await pool.query(`
        SELECT
          p.id,
          pr.nombre,
          pi.cantidad,
          pi.precio_unitario
        FROM pedido_items pi
        INNER JOIN productos pr
          ON pr.id = pi.producto_id
        INNER JOIN pedidos p
          ON p.id = pi.pedido_id
        WHERE p.id = $1
      `, [id]);
  
      res.json(result.rows);
  
    } catch (e) {
      next(e);
    }
  });

  app.put('/api/admin/pedidos/:id/estado',
    auth,
    soloAdmin, async (req, res, next) => {
    try {
  
      const { id } = req.params;
      const { estado } = req.body;
  
      await pool.query(
        `
        UPDATE pedidos
        SET estado = $1
        WHERE id = $2
        `,
        [estado, id]
      );
  
      res.json({
        success: true
      });
  
    } catch (e) {
  
      console.error(e);
  
      next(e);
  
    }
  });
// ---------- Sitio estático y errores ----------
app.use(express.static(path.join(__dirname, 'public'), { dotfiles: 'deny' }));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado.' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: 'Error interno. Intenta de nuevo.' }); });

app.listen(process.env.PORT || 3000, () => console.log('Licores la 79 en http://localhost:' + (process.env.PORT || 3000)));