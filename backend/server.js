const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Conectar a DB
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'prolimp_db'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a DB:', err);
        return;
    }
    console.log('¡Conectado a DB exitosamente!');
});

// Ruta para login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    db.query('SELECT id, nombre, primerApellido, segundoApellido, email, rol, contrasena FROM usuarios WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Error en DB' });
        if (results.length === 0) return res.json({ success: false, message: 'Usuario no encontrado' });
        const user = results[0];
        bcrypt.compare(password, user.contrasena, (err, match) => {
            if (match) {
                return res.json({ success: true, user: { id: user.id, nombre: user.nombre, primerApellido: user.primerApellido, segundoApellido: user.segundoApellido, email: user.email, rol: user.rol } });
            }
            return res.json({ success: false, message: 'Contraseña incorrecta' });
        });
    });
});

// Ruta GET para obtener productos
app.get('/productos', (req, res) => {
    db.query('SELECT * FROM productos', (err, results) => {
        if (err) {
            console.error('Error obteniendo productos:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta POST para agregar productos
app.post('/productos', (req, res) => {
    const { nombre, descripcion, precio, stock_actual, stock_minimo, id_unidad } = req.body;
    db.query('INSERT INTO productos (nombre, descripcion, precio, stock_actual, stock_minimo, id_unidad) VALUES (?, ?, ?, ?, ?, ?)', 
        [nombre, descripcion, precio, stock_actual, stock_minimo, id_unidad], (err, result) => {
        if (err) {
            console.error('Error insertando producto:', err);
            res.status(500).send('Error en DB: ' + err.message);
        } else {
            res.json({ id: result.insertId, message: 'Producto agregado' });
        }
    });
});

// Ruta PUT para actualizar stock de productos
app.put('/productos/:id', (req, res) => {
    const { stock_actual } = req.body;
    const { id } = req.params;
    db.query('UPDATE productos SET stock_actual = ? WHERE id = ?', 
        [stock_actual, id], (err, result) => {
        if (err) {
            console.error('Error actualizando stock:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Stock actualizado' });
        }
    });
});

// Ruta PUT para editar producto completo
app.put('/productos/:id/editar', (req, res) => {
    const { nombre, descripcion, precio, stock_actual, stock_minimo, id_unidad } = req.body;
    const { id } = req.params;
    db.query('UPDATE productos SET nombre = ?, descripcion = ?, precio = ?, stock_actual = ?, stock_minimo = ?, id_unidad = ? WHERE id = ?', 
        [nombre, descripcion, precio, stock_actual, stock_minimo, id_unidad, id], (err, result) => {
        if (err) {
            console.error('Error editando producto:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Producto actualizado' });
        }
    });
});

// Ruta DELETE para borrar producto
app.delete('/productos/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM productos WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error borrando producto:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Producto eliminado' });
        }
    });
});

// Ruta GET para obtener clientes
app.get('/clientes', (req, res) => {
    db.query('SELECT * FROM clientes', (err, results) => {
        if (err) {
            console.error('Error obteniendo clientes:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta POST para agregar clientes
app.post('/clientes', (req, res) => {
    const { nombre, primerApellido, segundoApellido, email, telefono, direccion } = req.body;
    db.query('INSERT INTO clientes (nombre, primerApellido, segundoApellido, email, telefono, direccion) VALUES (?, ?, ?, ?, ?, ?)', 
        [nombre, primerApellido, segundoApellido, email, telefono, direccion], (err, result) => {
        if (err) {
            console.error('Error insertando cliente:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ id: result.insertId, message: 'Cliente agregado' });
        }
    });
});

// Ruta GET para obtener todos los pedidos
app.get('/pedidos', (req, res) => {
    db.query('SELECT * FROM pedidos ORDER BY fecha DESC', (err, results) => {
        if (err) {
            console.error('Error obteniendo pedidos:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta POST para crear pedidos
app.post('/pedidos', (req, res) => {
    const { id_cliente, fecha, ubicacion_entrega, total } = req.body;
    db.query('INSERT INTO pedidos (id_cliente, fecha, ubicacion_entrega, total) VALUES (?, ?, ?, ?)', 
        [id_cliente, fecha, ubicacion_entrega || '', total], (err, result) => {
        if (err) {
            console.error('Error insertando pedido:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ id: result.insertId, message: 'Pedido creado' });
        }
    });
});

// Ruta GET para obtener detalles de un pedido específico
app.get('/pedidos/:id/detalles', (req, res) => {
    const { id } = req.params;
    db.query(`
        SELECT dp.*, p.nombre as nombre_producto, p.precio 
        FROM detalles_pedidos dp 
        JOIN productos p ON dp.id_producto = p.id 
        WHERE dp.id_pedido = ?
    `, [id], (err, results) => {
        if (err) {
            console.error('Error obteniendo detalles:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta POST para detalles de pedidos
app.post('/detalles_pedidos', (req, res) => {
    const { id_pedido, id_producto, cantidad, subtotal } = req.body;
    db.query('INSERT INTO detalles_pedidos (id_pedido, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)', 
        [id_pedido, id_producto, cantidad, subtotal], (err, result) => {
        if (err) {
            console.error('Error insertando detalle:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ id: result.insertId, message: 'Detalle agregado' });
        }
    });
});

// Ruta GET para unidades de medida
app.get('/unidades_medida', (req, res) => {
    db.query('SELECT * FROM unidades_medida', (err, results) => {
        if (err) {
            console.error('Error obteniendo unidades:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta PUT para editar cliente
app.put('/clientes/:id', (req, res) => {
    const { nombre, primerApellido, segundoApellido, email, telefono, direccion } = req.body;
    const { id } = req.params;
    db.query('UPDATE clientes SET nombre = ?, primerApellido = ?, segundoApellido = ?, email = ?, telefono = ?, direccion = ? WHERE id = ?', 
        [nombre, primerApellido, segundoApellido, email, telefono, direccion, id], (err, result) => {
        if (err) {
            console.error('Error editando cliente:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Cliente actualizado' });
        }
    });
});

// Ruta DELETE para borrar cliente
app.delete('/clientes/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM clientes WHERE id = ?', [id], (err, result) => {
        if (err) {
            console.error('Error borrando cliente:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Cliente eliminado' });
        }
    });
});

// GET todos los detalles de pedidos (para reportes)
app.get('/detalles_pedidos', (req, res) => {
    db.query('SELECT * FROM detalles_pedidos', (err, results) => {
        if (err) {
            console.error('Error obteniendo detalles:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// Ruta PUT para actualizar estado de pedido
app.put('/pedidos/:id/estado', (req, res) => {
    const { estado } = req.body;
    const { id } = req.params;
    
    // Validar que el estado sea válido
    const estadosValidos = ['pendiente', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
        return res.status(400).send('Estado inválido');
    }
    
    db.query('UPDATE pedidos SET estado = ? WHERE id = ?', 
        [estado, id], (err, result) => {
        if (err) {
            console.error('Error actualizando estado:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json({ message: 'Estado actualizado', estado });
        }
    });
});

// GET todos los usuarios
app.get('/usuarios', (req, res) => {
    db.query('SELECT id, nombre, primerApellido, segundoApellido, email, rol FROM usuarios', (err, results) => {
        if (err) {
            console.error('Error obteniendo usuarios:', err);
            res.status(500).send('Error en DB');
        } else {
            res.json(results);
        }
    });
});

// POST crear usuario
app.post('/usuarios', async (req, res) => {
    const { nombre, primerApellido, segundoApellido, email, contrasena, rol } = req.body;
    
    try {
        // Hashear contraseña
        const hashedPassword = await bcrypt.hash(contrasena, 10);
        
        db.query('INSERT INTO usuarios (nombre, primerApellido, segundoApellido, email, contrasena, rol) VALUES (?, ?, ?, ?, ?, ?)', 
            [nombre, primerApellido, segundoApellido, email, hashedPassword, rol], (err, result) => {
            if (err) {
                console.error('Error insertando usuario:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    res.status(400).send('El email ya existe');
                } else {
                    res.status(500).send('Error en DB');
                }
            } else {
                res.json({ id: result.insertId, message: 'Usuario creado' });
            }
        });
    } catch (error) {
        console.error('Error hasheando contraseña:', error);
        res.status(500).send('Error procesando contraseña');
    }
});

// PUT actualizar usuario
app.put('/usuarios/:id', async (req, res) => {
    const { nombre, primerApellido, segundoApellido, email, contrasena, rol } = req.body;
    const { id } = req.params;
    
    try {
        if (contrasena) {
            // Si se proporciona nueva contraseña, hashearla
            const hashedPassword = await bcrypt.hash(contrasena, 10);
            db.query('UPDATE usuarios SET nombre = ?, primerApellido = ?, segundoApellido = ?, email = ?, contrasena = ?, rol = ? WHERE id = ?', 
                [nombre, primerApellido, segundoApellido, email, hashedPassword, rol, id], (err, result) => {
                if (err) {
                    console.error('Error actualizando usuario:', err);
                    res.status(500).send('Error en DB');
                } else {
                    res.json({ message: 'Usuario actualizado' });
                }
            });
        } else {
            // Si no hay nueva contraseña, no actualizarla
            db.query('UPDATE usuarios SET nombre = ?, primerApellido = ?, segundoApellido = ?, email = ?, rol = ? WHERE id = ?', 
                [nombre, primerApellido, segundoApellido, email, rol, id], (err, result) => {
                if (err) {
                    console.error('Error actualizando usuario:', err);
                    res.status(500).send('Error en DB');
                } else {
                    res.json({ message: 'Usuario actualizado' });
                }
            });
        }
    } catch (error) {
        console.error('Error procesando actualización:', error);
        res.status(500).send('Error procesando actualización');
    }
});

// DELETE borrar usuario
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    
    // Verificar que no se borre el último admin
    db.query('SELECT COUNT(*) as adminCount FROM usuarios WHERE rol = "admin"', (err, results) => {
        if (err) {
            return res.status(500).send('Error verificando admins');
        }
        
        const adminCount = results[0].adminCount;
        
        // Verificar si el usuario a borrar es admin
        db.query('SELECT rol FROM usuarios WHERE id = ?', [id], (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).send('Error verificando usuario');
            }
            
            const userRol = results[0].rol;
            
            // Si es el último admin, no permitir borrar
            if (userRol === 'admin' && adminCount <= 1) {
                return res.status(400).send('No puedes eliminar el último administrador');
            }
            
            // Proceder a borrar
            db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, result) => {
                if (err) {
                    console.error('Error borrando usuario:', err);
                    res.status(500).send('Error en DB');
                } else {
                    res.json({ message: 'Usuario eliminado' });
                }
            });
        });
    });
});



app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});