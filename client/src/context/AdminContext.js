import React, { createContext, useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminName, setAdminName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminWalletAddress, setAdminWalletAddress] = useState('');
  const [adminPermissions, setAdminPermissions] = useState({});
  const [adminLoading, setAdminLoading] = useState(true);

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const checkAdminSession = async () => {
      try {
        setAdminLoading(true);
        
        // Verificar si hay token almacenado
        const hasSession = adminService.hasActiveSession();
        if (!hasSession) {
          setIsAdminAuthenticated(false);
          return;
        }

        // Obtener información del perfil
        const result = await adminService.getProfile();
        if (!result.success) {
          console.error('Error al verificar sesión de administrador:', result.error);
          adminLogout();
          return;
        }

        // Sesión válida
        setAdminDetails(
          result.admin.name,
          result.admin.username,
          result.admin.walletAddress || '',
          result.admin.permissions || {}
        );
        setIsAdminAuthenticated(true);
      } catch (error) {
        console.error('Error al verificar sesión de administrador:', error);
        adminLogout();
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminSession();
  }, []);

  // Iniciar sesión de administrador
  const adminLogin = async (username, password) => {
    try {
      const result = await adminService.login(username, password);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      setAdminDetails(
        result.admin.name,
        result.admin.username,
        result.admin.walletAddress || '',
        result.admin.permissions || {}
      );
      setIsAdminAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Error en login de administrador:', error);
      return { success: false, error: error.message || 'Error de autenticación' };
    }
  };

  // Iniciar sesión con MetaMask
  const adminLoginWithMetaMask = async () => {
    try {
      const result = await adminService.loginWithMetaMask();
      
      if (!result.success) {
        return { success: false, error: result.error };
      }
      
      setAdminDetails(
        result.admin.name,
        result.admin.username,
        result.address || '',
        result.admin.permissions || {}
      );
      setIsAdminAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('Error en login de administrador con MetaMask:', error);
      return { success: false, error: error.message || 'Error de autenticación' };
    }
  };

  // Cerrar sesión de administrador
  const adminLogout = () => {
    adminService.logout();
    setIsAdminAuthenticated(false);
    setAdminDetails('', '', '', {});
  };

  // Función auxiliar para actualizar los detalles del administrador
  const setAdminDetails = (name, username, walletAddress, permissions) => {
    setAdminName(name);
    setAdminUsername(username);
    setAdminWalletAddress(walletAddress);
    setAdminPermissions(permissions);
  };

  return (
    <AdminContext.Provider
      value={{
        isAdminAuthenticated,
        adminName,
        adminUsername,
        adminWalletAddress,
        adminPermissions,
        adminLoading,
        adminLogin,
        adminLoginWithMetaMask,
        adminLogout
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
