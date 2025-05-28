import React, { useState, useContext, useEffect } from 'react';
import { Card, Button, Container, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const IdLogin = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useContext(AuthContext);
  const [cedula, setCedula] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Si el usuario ya está autenticado, redirigir a la página principal
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Validar formato de la cédula
  const validateCedula = (value) => {
    // Eliminar guiones y espacios
    const cleanValue = value.replace(/[-\s]/g, '');
    // Verificar que solo contiene números
    if (!/^\d+$/.test(cleanValue)) {
      return false;
    }
    // Verificar que comienza con 012 o 402 y tiene exactamente 11 dígitos
    const regex = /^(012|402)\d{8}$/;
    return regex.test(cleanValue) && cleanValue.length === 11;
  };

  const handleCedulaChange = (e) => {
    // Solo permitir números, guiones y espacios
    const value = e.target.value.replace(/[^0-9\-\s]/g, '');
    setCedula(value);
    
    // Limpiar la cédula para la validación
    const cleanValue = value.replace(/[-\s]/g, '');
    
    if (value.trim() === '') {
      setErrors({ cedula: t('auth.id_required') });
      setIsValid(false);
    } else if (!/^\d+$/.test(cleanValue)) {
      setErrors({ cedula: t('auth.only_numbers') });
      setIsValid(false);
    } else if (!validateCedula(cleanValue)) {
      setErrors({ cedula: t('auth.invalid_id_format') });
      setIsValid(false);
    } else {
      setErrors({});
      setIsValid(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isValid) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Limpiar la cédula antes de enviarla
    const cleanCedula = cedula.replace(/[-\s]/g, '');
    
    console.log('Enviando cédula al siguiente paso:', cleanCedula);
    
    // Aquí continuamos al siguiente paso para la autenticación con MetaMask
    navigate('/connect-wallet', { 
      state: { 
        cedula: cleanCedula 
      } 
    });
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="shadow-sm">
            <Card.Body className="p-5">
              <div className="text-center mb-4">
                <i className="fas fa-vote-yea fa-3x text-primary mb-3"></i>
                <h2>Tu voto R.D.</h2>
                <p className="text-muted">
                  {t('auth.id_verification_prompt')}
                </p>
              </div>
              
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-4">
                  <Form.Label>Coloque su cédula</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="012XXXXXXXX o 402XXXXXXXX"
                      value={cedula}
                      onChange={handleCedulaChange}
                      isInvalid={!!errors.cedula}
                      maxLength={13}
                      className="form-control-lg"
                      inputMode="numeric"
                      pattern="[0-9\-\s]*"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.cedula}
                    </Form.Control.Feedback>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    {t('auth.id_format_help')}
                  </Form.Text>
                </Form.Group>
                
                <Button 
                  variant="primary" 
                  size="lg" 
                  type="submit"
                  className="w-100 mt-3"
                  disabled={!isValid || isSubmitting}
                >
                  {isSubmitting ? t('auth.verifying') : t('auth.continue')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default IdLogin;
