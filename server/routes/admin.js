const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

/**
 * Basic validation middleware to reduce dependency on express-validator
 */
const validateLoginRequest = (req, res, next) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Se requiere nombre de usuario y contraseña'
    });
  }
  next();
};

const validateSignatureRequest = (req, res, next) => {
  const { address, signature, message } = req.body;
  if (!address || !signature || !message) {
    return res.status(400).json({
      success: false,
      message: 'Se requieren dirección, firma y mensaje'
    });
  }
  
  // Simple Ethereum address validation
  const ethAddressPattern = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressPattern.test(address)) {
    return res.status(400).json({
      success: false,
      message: 'Dirección Ethereum inválida'
    });
  }
  next();
};

/**
 * Custom simple auth middleware
 */
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No hay token, autorización denegada'
      });
    }
    
    // In a real implementation, you would verify the token here
    // For now, we'll just trust that the token exists
    req.user = { id: 'temp-admin-id' };
    next();
  } catch (err) {
    console.error('Error en autenticación:', err);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * @route   POST /api/admin/login
 * @desc    Login de administrador con credenciales
 * @access  Público
 */
router.post('/login', validateLoginRequest, adminController.login);

/**
 * @route   GET /api/admin/nonce
 * @desc    Obtener nonce para autenticación con MetaMask
 * @access  Público
 */
router.get('/nonce', adminController.getNonce);

/**
 * @route   POST /api/admin/verify-signature
 * @desc    Verificar firma de MetaMask
 * @access  Público
 */
router.post('/verify-signature', validateSignatureRequest, adminController.verifySignature);

/**
 * @route   GET /api/admin/profile
 * @desc    Obtener perfil del administrador
 * @access  Privado (solo admin)
 */
router.get('/profile', adminAuth, adminController.getProfile);

/**
 * @route   GET /api/admin/test
 * @desc    Ruta de prueba para verificar que la API de admin funciona
 * @access  Público
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API de administración funcionando correctamente',
    timestamp: new Date()
  });
});

module.exports = router;
