const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(bodyParser.json());  // Middleware para parsear JSON

// Archivo de almacenamiento de tareas
const DB_FILE = path.join(__dirname, 'tareas.json');

// Cargar tareas del archivo
const cargarTareas = () => {
  if (!fs.existsSync(DB_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Guardar tareas en el archivo
const guardarTareas = (tareas) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(tareas, null, 2));
};

// Inicializar base de datos
let tareas = cargarTareas();
let proximoId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1;

// Ruta para obtener todas las tareas
app.get('/tareas', async (req, res) => {
  try {
    res.json(tareas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener tareas', error: error.message });
  }
});

// Ruta para obtener una tarea por ID
app.get('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tarea = tareas.find(t => t.id === parseInt(id));
    if (!tarea) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    res.json(tarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener la tarea', error: error.message });
  }
});

// Ruta para crear una nueva tarea
app.post('/tareas', async (req, res) => {
  console.log('Headers:', req.headers);  // Debug: ver headers
  console.log('Body recibido:', req.body);  // Debug: ver qué llega
  
  if (!req.body) {
    return res.status(400).json({ error: 'El cuerpo de la solicitud es requerido' });
  }
  
  const { titulo, descripcion, completada } = req.body;
  
  // Validar campos requeridos
  if (!titulo || titulo.trim() === '') {
    return res.status(400).json({ message: 'El título es requerido' });
  }
  if (!descripcion || descripcion.trim() === '') {
    return res.status(400).json({ message: 'La descripción es requerida' });
  }
  
  try {
    const nuevaTarea = {
      id: proximoId++,
      titulo,
      descripcion,
      completada: completada || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    tareas.push(nuevaTarea);
    guardarTareas(tareas);
    res.status(201).json(nuevaTarea);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear la tarea', error: error.message });
  }
});

// Ruta para actualizar una tarea existente
app.put('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  const { titulo, descripcion, completada } = req.body;
  
  // Validar que al menos un campo sea proporcionado
  if (titulo === undefined && descripcion === undefined && completada === undefined) {
    return res.status(400).json({ message: 'Debes proporcionar al menos un campo para actualizar' });
  }
  
  try {
    const tareaIndex = tareas.findIndex(t => t.id === parseInt(id));
    if (tareaIndex === -1) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    
    // Actualizar solo los campos proporcionados
    if (titulo !== undefined) tareas[tareaIndex].titulo = titulo;
    if (descripcion !== undefined) tareas[tareaIndex].descripcion = descripcion;
    if (completada !== undefined) tareas[tareaIndex].completada = completada;
    tareas[tareaIndex].updatedAt = new Date();
    
    guardarTareas(tareas);
    res.json(tareas[tareaIndex]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar la tarea', error: error.message });
  }
});

// Ruta para eliminar una tarea
app.delete('/tareas/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const tareaIndex = tareas.findIndex(t => t.id === parseInt(id));
    if (tareaIndex === -1) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }
    tareas.splice(tareaIndex, 1);
    guardarTareas(tareas);
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar la tarea', error: error.message });
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
}); 