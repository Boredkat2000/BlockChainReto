const Admin = require('../models/Admin');
const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');

/**
 * Controlador para operaciones de administración
 */
const adminController = {
  /**
   * Login de administrador con credenciales
   * @param {Object} req - Solicitud HTTP
   * @param {Object} res - Respuesta HTTP
   */
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Validar campos requeridos
      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere nombre de usuario y contraseña'
        });
      }
      
      // Buscar administrador por nombre de usuario
      const admin = await Admin.findOne({ username: username.toLowerCase() });
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
      
      // Verificar contraseña
      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }
      
      // Generar token JWT
      const token = admin.generateAuthToken();
      
      // Enviar respuesta
      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          username: admin.username,
          walletAddress: admin.walletAddress,
          permissions: admin.permissions
        }
      });
    } catch (error) {
      console.error('Error en login de administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },
  
  /**
   * Obtener nonce para autenticación con MetaMask
   * @param {Object} req - Solicitud HTTP
   * @param {Object} res - Respuesta HTTP
   */
  getNonce: async (req, res) => {
    try {
      // Generar un nonce aleatorio
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const message = `Iniciar sesión como administrador: ${nonce}`;
      
      // Guardar el nonce en la sesión
      req.session = req.session || {};
      req.session.nonce = nonce;
      
      res.json({
        success: true,
        message
      });
    } catch (error) {
      console.error('Error al generar nonce:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },
  
  /**
   * Verificar firma de MetaMask
   * @param {Object} req - Solicitud HTTP
   * @param {Object} res - Respuesta HTTP
   */
  verifySignature: async (req, res) => {
    try {
      const { address, signature, message } = req.body;
      
      // Validar campos requeridos
      if (!address || !signature || !message) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren dirección, firma y mensaje'
        });
      }
      
      // Verificar la firma
      const signerAddr = ethers.utils.verifyMessage(message, signature);
      
      if (signerAddr.toLowerCase() !== address.toLowerCase()) {
        return res.status(401).json({
          success: false,
          message: 'Firma inválida'
        });
      }
      
      // Buscar administrador por dirección de wallet
      const admin = await Admin.findOne({ 
        walletAddress: address.toLowerCase() 
      });
      
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'No hay un administrador asociado a esta dirección de wallet'
        });
      }
      
      // Generar token JWT
      const token = admin.generateAuthToken();
      
      // Enviar respuesta
      res.json({
        success: true,
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          username: admin.username,
          walletAddress: admin.walletAddress,
          permissions: admin.permissions
        }
      });
    } catch (error) {
      console.error('Error al verificar firma:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  },
  
  /**
   * Obtener perfil del administrador
   * @param {Object} req - Solicitud HTTP
   * @param {Object} res - Respuesta HTTP
   */
  getProfile: async (req, res) => {
    try {
      // Buscar administrador por ID
      const admin = await Admin.findById(req.user.id);
      
      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado'
        });
      }
      
      // Enviar respuesta
      res.json({
        success: true,
        admin: {
          id: admin._id,
          name: admin.name,
          username: admin.username,
          walletAddress: admin.walletAddress,
          permissions: admin.permissions
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil de administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error en el servidor'
      });
    }
  }
};

module.exports = adminController;
