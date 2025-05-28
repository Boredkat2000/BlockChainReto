const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

// Importar el modelo de Admin
const Admin = require('../models/Admin');

// Función para crear administrador
async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/voting-platform', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('MongoDB conectado correctamente');
    
    // Credenciales del administrador
    const adminData = {
      name: 'Katriel Castillo Encarnacion',
      username: 'katriel',
      password: 'FMR2F7Qg@',
      permissions: {
        canManageElections: true,
        canManageVoters: true,
        canViewStatistics: true
      }
    };
    
    // Verificar si el administrador ya existe
    const existingAdmin = await Admin.findOne({ username: adminData.username });
    
    if (existingAdmin) {
      console.log('El administrador ya existe. Actualizando datos...');
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Actualizar datos
      existingAdmin.name = adminData.name;
      existingAdmin.password = hashedPassword;
      existingAdmin.permissions = adminData.permissions;
      
      await existingAdmin.save();
      console.log('Administrador actualizado correctamente');
    } else {
      console.log('Creando nuevo administrador...');
      
      // Hashear la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminData.password, salt);
      
      // Crear nuevo administrador
      const newAdmin = new Admin({
        name: adminData.name,
        username: adminData.username,
        password: hashedPassword,
        permissions: adminData.permissions
      });
      
      await newAdmin.save();
      console.log('Administrador creado correctamente');
    }
    
    // Mostrar información de acceso
    console.log('Información de acceso:');
    console.log('Usuario: ' + adminData.username);
    console.log('Contraseña: ' + adminData.password);
    console.log('Nombre completo: ' + adminData.name);
    
    // Cerrar conexión
    mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('Error al crear administrador:', error);
  }
}

// Ejecutar función
createAdmin();
