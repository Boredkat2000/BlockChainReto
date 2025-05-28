import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Badge, Alert, Spinner, Tabs, Tab } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import AdminContext from '../../context/AdminContext';
import { formatTimestamp, formatAddress, isElectionActive, hasElectionEnded } from '../../utils/contractUtils';
import { toast } from 'react-toastify';
import StatsDashboard from './stats/StatsDashboard';

const AdminDashboard = () => {
  // Eliminamos la variable t ya que no la estamos usando
  const [elections, setElections] = useState([]);
  const [voterStats, setVoterStats] = useState({ totalRegistered: 0, totalVoted: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { isAdminAuthenticated, adminPermissions } = useContext(AdminContext);
  const navigate = useNavigate();

  const fetchElections = useCallback(async () => {
    try {
      setLoading(true);
      
      // En lugar de hacer peticiones a la API, usamos datos de ejemplo
      console.log('Cargando datos de ejemplo para el panel de administración');
      
      // Ejemplo de elecciones
      const mockElections = [
        {
          id: '1',
          title: 'Elección Municipal 2025',
          description: 'Elección para alcalde y concejales',
          startTime: Math.floor(Date.now() / 1000) - 86400, // Ayer
          endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // Una semana desde ahora
          totalVotes: 156,
          candidateCount: 5,
          resultsFinalized: false
        },
        {
          id: '2',
          title: 'Presupuesto Participativo',
          description: 'Votación para decidir el uso de fondos municipales',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 30, // Hace 30 días
          endTime: Math.floor(Date.now() / 1000) - 86400, // Ayer
          totalVotes: 243,
          candidateCount: 3,
          resultsFinalized: false
        },
        {
          id: '3',
          title: 'Consulta Ciudadana',
          description: 'Opinión sobre nuevas políticas de transporte público',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 60, // Hace 60 días
          endTime: Math.floor(Date.now() / 1000) - 86400 * 30, // Hace 30 días
          totalVotes: 412,
          candidateCount: 2,
          resultsFinalized: true
        }
      ];
      
      setElections(mockElections);
      
      // Estadísticas de ejemplo
      const totalRegistered = 1500;
      const totalVoted = 811;
      
      setVoterStats({ totalRegistered, totalVoted });
      
      setError('');
      console.log('Datos de ejemplo cargados correctamente');
    } catch (error) {
      console.error('Error cargando datos de ejemplo:', error);
      setError('Error al cargar los datos de ejemplo. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Redirect if not authenticated as admin
    if (!isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    
    // Check if admin has permissions to view dashboard
    if (!adminPermissions.canViewDashboard) {
      toast.error('No tienes permisos para acceder al panel de administración');
      navigate('/');
      return;
    }
    
    fetchElections();
  }, [isAdminAuthenticated, adminPermissions, navigate, fetchElections]);

  const handleEndElection = async (electionId) => {
    try {
      setActionLoading(true);
      
      // Simulación de finalización de elección
      console.log('Finalizando elección con ID:', electionId);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Actualizar las elecciones localmente
      setElections(prevElections => {
        return prevElections.map(election => {
          if (election.id === electionId) {
            return {
              ...election,
              endTime: Math.floor(Date.now() / 1000) // Establecer fin al momento actual
            };
          }
          return election;
        });
      });
      
      toast.success('Elección finalizada correctamente');
    } catch (error) {
      console.error('Error al finalizar la elección:', error);
      toast.error('Error al finalizar la elección. Por favor, intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalizeResults = async (electionId) => {
    try {
      setActionLoading(true);
      
      // Simulación de finalización de resultados
      console.log('Finalizando resultados de elección con ID:', electionId);
      
      // Simular tiempo de procesamiento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Actualizar las elecciones localmente
      setElections(prevElections => {
        return prevElections.map(election => {
          if (election.id === electionId) {
            return {
              ...election,
              resultsFinalized: true
            };
          }
          return election;
        });
      });
      
      toast.success('Resultados finalizados correctamente');
    } catch (error) {
      console.error('Error al finalizar resultados:', error);
      toast.error('Error al finalizar los resultados. Por favor, intenta de nuevo.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (election) => {
    if (election.resultsFinalized) return <Badge bg="success">Finalizada</Badge>;
    if (hasElectionEnded(election)) return <Badge bg="warning">Terminada</Badge>;
    if (isElectionActive(election)) return <Badge bg="primary">Activa</Badge>;
    return <Badge bg="secondary">Pendiente</Badge>;
  };

  return (
    <Container fluid className="py-4">
      <h2 className="mb-4">Panel de Administración</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Tabs 
        activeKey={activeTab} 
        onSelect={(key) => setActiveTab(key)} 
        className="mb-4"
      >
        <Tab eventKey="overview" title="Resumen">
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  <i className="fas fa-vote-yea text-primary mb-3 fa-3x"></i>
                  <h2 className="mb-0">{elections.length}</h2>
                  <p className="text-muted">Elecciones Totales</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  <i className="fas fa-user-check text-success mb-3 fa-3x"></i>
                  <h2 className="mb-0">{voterStats.totalRegistered}</h2>
                  <p className="text-muted">Votantes Registrados</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  <i className="fas fa-poll text-info mb-3 fa-3x"></i>
                  <h2 className="mb-0">{voterStats.totalVoted}</h2>
                  <p className="text-muted">Votos Emitidos</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 shadow-sm">
                <Card.Body className="d-flex flex-column align-items-center">
                  <i className="fas fa-percentage text-warning mb-3 fa-3x"></i>
                  <h2 className="mb-0">
                    {voterStats.totalRegistered > 0 
                      ? Math.round((voterStats.totalVoted / voterStats.totalRegistered) * 100) 
                      : 0}%
                  </h2>
                  <p className="text-muted">Participación</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card className="shadow-sm mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Elecciones Activas</h5>
                <Button 
                  as={Link} 
                  to="/admin/create-election" 
                  variant="primary" 
                  size="sm"
                  disabled={!adminPermissions.canCreateElection}
                >
                  <i className="fas fa-plus me-2"></i>
                  Nueva Elección
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Cargando...</span>
                  </Spinner>
                </div>
              ) : elections.length > 0 ? (
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Título</th>
                      <th>Estado</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Votos</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {elections.map((election) => (
                      <tr key={election.id}>
                        <td>{election.id}</td>
                        <td>{election.title}</td>
                        <td>{getStatusBadge(election)}</td>
                        <td>{formatTimestamp(election.startTime)}</td>
                        <td>{formatTimestamp(election.endTime)}</td>
                        <td>{election.totalVotes}</td>
                        <td>
                          <div className="d-flex">
                            <Button
                              as={Link}
                              to={`/admin/elections/${election.id}`}
                              variant="outline-primary"
                              size="sm"
                              className="me-2"
                              disabled={!adminPermissions.canViewElection}
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                            
                            {isElectionActive(election) && (
                              <Button
                                variant="outline-warning"
                                size="sm"
                                className="me-2"
                                onClick={() => handleEndElection(election.id)}
                                disabled={actionLoading || !adminPermissions.canEndElection}
                              >
                                <i className="fas fa-stop-circle"></i>
                              </Button>
                            )}
                            
                            {hasElectionEnded(election) && !election.resultsFinalized && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleFinalizeResults(election.id)}
                                disabled={actionLoading || !adminPermissions.canFinalizeResults}
                              >
                                <i className="fas fa-check-double"></i>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No hay elecciones activas</p>
                  {adminPermissions.canCreateElection && (
                    <Button 
                      as={Link} 
                      to="/admin/create-election" 
                      variant="primary" 
                      className="mt-3"
                    >
                      Crear Nueva Elección
                    </Button>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Enlaces Rápidos</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3 mb-md-0">
                  <Button
                    as={Link}
                    to="/admin/voters"
                    variant="outline-primary"
                    className="w-100 py-3"
                    disabled={!adminPermissions.canManageVoters}
                  >
                    <i className="fas fa-users mb-2 fa-2x"></i>
                    <div>Gestión de Votantes</div>
                  </Button>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Button
                    as={Link}
                    to="/admin/candidates"
                    variant="outline-primary"
                    className="w-100 py-3"
                    disabled={!adminPermissions.canManageCandidates}
                  >
                    <i className="fas fa-user-tie mb-2 fa-2x"></i>
                    <div>Gestión de Candidatos</div>
                  </Button>
                </Col>
                <Col md={3} className="mb-3 mb-md-0">
                  <Button
                    as={Link}
                    to="/admin/settings"
                    variant="outline-primary"
                    className="w-100 py-3"
                    disabled={!adminPermissions.canManageSettings}
                  >
                    <i className="fas fa-cogs mb-2 fa-2x"></i>
                    <div>Configuración</div>
                  </Button>
                </Col>
                <Col md={3}>
                  <Button
                    as={Link}
                    to="/admin/activity"
                    variant="outline-primary"
                    className="w-100 py-3"
                    disabled={!adminPermissions.canViewActivity}
                  >
                    <i className="fas fa-history mb-2 fa-2x"></i>
                    <div>Registro de Actividad</div>
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="statistics" title="Estadísticas">
          <StatsDashboard />
        </Tab>
      </Tabs>
      
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header>
              <h5 className="mb-0">Actividad Reciente</h5>
            </Card.Header>
            <Card.Body>
              <div className="ps-2">
                <div className="activity-stream">
                  {/* En una aplicación real, obtendríamos esto de un registro de auditoría */}
                  <div className="activity-item d-flex align-items-start">
                    <div className="activity-icon me-3">
                      <i className="fas fa-check-circle text-success"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>Elección creada</strong>
                        <small className="text-muted">hace 2 horas</small>
                      </div>
                      <p className="mb-0">Nueva elección "Presupuesto Municipal 2025" fue creada</p>
                    </div>
                  </div>
                  <div className="activity-item d-flex align-items-start mt-3">
                    <div className="activity-icon me-3">
                      <i className="fas fa-user-plus text-primary"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>Votantes registrados</strong>
                        <small className="text-muted">hace 3 horas</small>
                      </div>
                      <p className="mb-0">5 nuevos votantes fueron registrados para la elección "Concejo Municipal 2025"</p>
                    </div>
                  </div>
                  <div className="activity-item d-flex align-items-start mt-3">
                    <div className="activity-icon me-3">
                      <i className="fas fa-vote-yea text-info"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>Voto registrado</strong>
                        <small className="text-muted">hace 5 horas</small>
                      </div>
                      <p className="mb-0">
                        Nuevo voto registrado para "Elección de Junta Escolar" desde {formatAddress("0x1234567890abcdef1234567890abcdef12345678")}
                      </p>
                    </div>
                  </div>
                  <div className="activity-item d-flex align-items-start mt-3">
                    <div className="activity-icon me-3">
                      <i className="fas fa-flag-checkered text-warning"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>Elección finalizada</strong>
                        <small className="text-muted">hace 1 día</small>
                      </div>
                      <p className="mb-0">Elección "Propuesta Jardín Comunitario" fue marcada como finalizada</p>
                    </div>
                  </div>
                  <div className="activity-item d-flex align-items-start mt-3">
                    <div className="activity-icon me-3">
                      <i className="fas fa-chart-pie text-success"></i>
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <strong>Resultados finalizados</strong>
                        <small className="text-muted">hace 2 días</small>
                      </div>
                      <p className="mb-0">Resultados para "Votación Extensión Biblioteca" fueron finalizados</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminDashboard;
