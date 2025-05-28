import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import AdminContext from '../../context/AdminContext';
import { Spinner, Container } from 'react-bootstrap';

/**
 * Componente para proteger rutas de administrador
 * @param {Object} props - Propiedades del componente
 * @param {JSX.Element} props.element - Elemento a renderizar si el usuario es administrador
 * @returns {JSX.Element}
 */
const AdminRoute = ({ element }) => {
  const { isAdminAuthenticated, adminLoading } = useContext(AdminContext);

  // Mostrar spinner mientras se verifica la autenticación
  if (adminLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "80vh" }}>
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Verificando credenciales de administrador...</p>
        </div>
      </Container>
    );
  }

  // Redirigir a login de administrador si no está autenticado
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin-login" />;
  }

  // Si está autenticado, mostrar el elemento
  return element;
};

export default AdminRoute;
