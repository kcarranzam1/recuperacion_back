const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configuración de la conexión a SQL Server
const dbConfig = {
    user: 'usr_DesaWeb',
    password: 'GuasTa360#',
    server: 'svr-sql-ctezo.southcentralus.cloudapp.azure.com',
    database: 'db_banco',
    options: {
        encrypt: true,
        trustServerCertificate: true
    }
};

// Conexión al servidor SQL
sql.connect(dbConfig).then((pool) => {
    console.log('Conectado a SQL Server');

    // Ruta de prueba
    app.get('/', (req, res) => {
        res.send('¡Servidor funcionando correctamente con SQL Server!');
    });

    /*** CRUD para TiposEvento (Catálogo) ***/
    // Crear un tipo de evento
    app.post('/tipos-evento', async (req, res) => {
        const { nombre, descripcion } = req.body;
        try {
            const result = await pool.request()
                .input('nombre', sql.VarChar(50), nombre)
                .input('descripcion', sql.Text, descripcion)
                .query('INSERT INTO Kv_TiposEvento (nombre, descripcion) OUTPUT INSERTED.idTipoEvento VALUES (@nombre, @descripcion)');
            res.status(201).json({ idTipoEvento: result.recordset[0].idTipoEvento, nombre, descripcion });
        } catch (err) {
            console.error('Error al crear el tipo de evento:', err);
            res.status(500).send('Error al crear el tipo de evento');
        }
    });

    // Obtener todos los tipos de evento
    app.get('/tipos-evento', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT nombre FROM Kv_TiposEvento');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener los tipos de evento:', err);
            res.status(500).send('Error al obtener los tipos de evento');
        }
    });

    // Actualizar un tipo de evento
    app.put('/tipos-evento/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, descripcion } = req.body;
        try {
            const result = await pool.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.VarChar(50), nombre)
                .input('descripcion', sql.Text, descripcion)
                .query('UPDATE Kv_TiposEvento SET nombre = @nombre, descripcion = @descripcion WHERE idTipoEvento = @id');
            res.json({ message: 'Tipo de evento actualizado correctamente' });
        } catch (err) {
            console.error('Error al actualizar el tipo de evento:', err);
            res.status(500).send('Error al actualizar el tipo de evento');
        }
    });

    // Eliminar un tipo de evento
    app.delete('/tipos-evento/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.request()
                .input('id', sql.Int, id)
                .query('DELETE FROM Kv_TiposEvento WHERE idTipoEvento = @id');
            res.json({ message: 'Tipo de evento eliminado correctamente' });
        } catch (err) {
            console.error('Error al eliminar el tipo de evento:', err);
            res.status(500).send('Error al eliminar el tipo de evento');
        }
    });

    /*** CRUD para EventosCorporativos (Maestro) ***/
    // Crear un evento corporativo
    app.post('/eventos', async (req, res) => {
        const { nombre, fecha, idTipoEvento, ubicacion, descripcion } = req.body;
        try {
            const result = await pool.request()
                .input('nombre', sql.VarChar(100), nombre)
                .input('fecha', sql.Date, fecha)
                .input('idTipoEvento', sql.Int, idTipoEvento)
                .input('ubicacion', sql.VarChar(200), ubicacion)
                .input('descripcion', sql.Text, descripcion)
                .query(`INSERT INTO Kv_EventosCorporativos (nombre, fecha, idTipoEvento, ubicacion, descripcion)
                        OUTPUT INSERTED.idEvento
                        VALUES (@nombre, @fecha, @idTipoEvento, @ubicacion, @descripcion)`);
            res.status(201).json({ idEvento: result.recordset[0].idEvento, nombre, fecha, idTipoEvento, ubicacion, descripcion });
        } catch (err) {
            console.error('Error al crear el evento:', err);
            res.status(500).send('Error al crear el evento');
        }
    });

    // Obtener todos los eventos corporativos
    app.get('/eventos', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM Kv_EventosCorporativos');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener los eventos:', err);
            res.status(500).send('Error al obtener los eventos');
        }
    });

    // Actualizar un evento corporativo
    app.put('/eventos/:id', async (req, res) => {
        const { id } = req.params;
        const { nombre, fecha, idTipoEvento, ubicacion, descripcion } = req.body;
        try {
            const result = await pool.request()
                .input('idEvento', sql.Int, id)
                .input('nombre', sql.VarChar(100), nombre)
                .input('fecha', sql.Date, fecha)
                .input('idTipoEvento', sql.Int, idTipoEvento)
                .input('ubicacion', sql.VarChar(200), ubicacion)
                .input('descripcion', sql.Text, descripcion)
                .query(`UPDATE Kv_EventosCorporativos 
                        SET nombre = @nombre, fecha = @fecha, idTipoEvento = @idTipoEvento, ubicacion = @ubicacion, descripcion = @descripcion 
                        WHERE idEvento = @idEvento`);
            res.json({ message: 'Evento actualizado correctamente' });
        } catch (err) {
            console.error('Error al actualizar el evento:', err);
            res.status(500).send('Error al actualizar el evento');
        }
    });

    // Eliminar un evento corporativo
    app.delete('/eventos/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.request()
                .input('idEvento', sql.Int, id)
                .query('DELETE FROM Kv_EventosCorporativos WHERE idEvento = @idEvento');
            res.json({ message: 'Evento eliminado correctamente' });
        } catch (err) {
            console.error('Error al eliminar el evento:', err);
            res.status(500).send('Error al eliminar el evento');
        }
    });

    /*** CRUD para AsistentesEvento (Detalle) ***/
    // Crear un asistente al evento
    app.post('/asistentes', async (req, res) => {
        const { idEvento, nombre, correoElectronico, telefono, idRol } = req.body;
    
        try {
            // Intenta insertar el asistente
            const result = await pool.request()
                .input('idEvento', sql.Int, idEvento)
                .input('nombre', sql.VarChar(100), nombre)
                .input('correoElectronico', sql.VarChar(100), correoElectronico)
                .input('telefono', sql.VarChar(15), telefono)
                .input('idRol', sql.Int, idRol)
                .query(`INSERT INTO Kv_AsistentesEvento 
                        (idEvento, nombre, correoElectronico, telefono, idRol)
                        OUTPUT INSERTED.idAsistente
                        VALUES (@idEvento, @nombre, @correoElectronico, @telefono, @idRol)`);
    
            res.status(201).json({
                idAsistente: result.recordset[0].idAsistente,
                idEvento,
                nombre,
                correoElectronico,
                telefono,
                idRol
            });
        } catch (err) {
            if (err.originalError && err.originalError.info && err.originalError.info.message.includes('FOREIGN KEY constraint')) {
                return res.status(400).json({ message: 'El idRol no existe en la tabla Kv_RolesAsistentes. Verifica los roles disponibles.' });
            }
            console.error('Error al crear el asistente:', err);
            res.status(500).json({ message: 'Error al crear el asistente', error: err.message });
        }
    });

    // Obtener todos los asistentes
    app.get('/asistentes', async (req, res) => {
        try {
            const result = await pool.request().query('SELECT * FROM Kv_AsistentesEvento');
            res.json(result.recordset);
        } catch (err) {
            console.error('Error al obtener los asistentes:', err);
            res.status(500).send('Error al obtener los asistentes');
        }
    });

    // Actualizar un asistente
    app.put('/asistentes/:id', async (req, res) => {
        const { id } = req.params;
        const { idEvento, nombre, correoElectronico, telefono, idRol } = req.body;
        try {
            const result = await pool.request()
                .input('idAsistente', sql.Int, id)
                .input('idEvento', sql.Int, idEvento)
                .input('nombre', sql.VarChar(100), nombre)
                .input('correoElectronico', sql.VarChar(100), correoElectronico)
                .input('telefono', sql.VarChar(15), telefono)
                .input('idRol', sql.Int, idRol)
                .query(`UPDATE Kv_AsistentesEvento 
                        SET idEvento = @idEvento, nombre = @nombre, correoElectronico = @correoElectronico, telefono = @telefono, idRol = @idRol 
                        WHERE idAsistente = @idAsistente`);
            res.json({ message: 'Asistente actualizado correctamente' });
        } catch (err) {
            console.error('Error al actualizar el asistente:', err);
            res.status(500).send('Error al actualizar el asistente');
        }
    });

    // Eliminar un asistente
    app.delete('/asistentes/:id', async (req, res) => {
        const { id } = req.params;
        try {
            await pool.request()
                .input('idAsistente', sql.Int, id)
                .query('DELETE FROM Kv_AsistentesEvento WHERE idAsistente = @idAsistente');
            res.json({ message: 'Asistente eliminado correctamente' });
        } catch (err) {
            console.error('Error al eliminar el asistente:', err);
            res.status(500).send('Error al eliminar el asistente');
        }
    });

}).catch((err) => {
    console.error('Error al conectar a SQL Server:', err);
});

const PORT = process.env.PORT || 3009;
app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});