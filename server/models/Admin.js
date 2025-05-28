const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  walletAddress: {
    type: String,
    trim: true,
    lowercase: true
  },
  permissions: {
    canViewDashboard: {
      type: Boolean,
      default: true
    },
    canCreateElections: {
      type: Boolean,
      default: false
    },
    canManageElections: {
      type: Boolean,
      default: false
    },
    canManageVoters: {
      type: Boolean,
      default: false
    },
    canFinalizeResults: {
      type: Boolean,
      default: false
    },
    canViewReports: {
      type: Boolean,
      default: true
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware para encriptar la contraseña antes de guardar
AdminSchema.pre('save', async function(next) {
  // Solo encriptar si la contraseña se modificó
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para generar token JWT
AdminSchema.methods.generateAuthToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      username: this.username,
      type: 'admin'
    },
    process.env.JWT_SECRET || 'blockchain_secret_key',
    { expiresIn: '24h' }
  );
};

module.exports = mongoose.model('Admin', AdminSchema);
