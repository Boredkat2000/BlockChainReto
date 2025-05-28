// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title VotingSystem
 * @dev Sistema de votación basado en blockchain con características mejoradas:
 * - Gestión de elecciones (crear, finalizar, obtener resultados)
 * - Gestión de candidatos (añadir, obtener información)
 * - Gestión de votantes (registrar, verificar estado)
 * - Emisión de votos seguros
 * - Eventos detallados para seguimiento
 *
 * @author Plataforma de Votación Blockchain
 * @notice Este contrato permite crear y gestionar elecciones de forma segura y transparente
 */
contract VotingSystem {
    // ---- Estructuras ----
    
    /**
     * @dev Información del votante
     * @param isRegistered Indica si el votante está registrado
     * @param hasVoted Indica si el votante ya ha emitido su voto
     * @param voteTimestamp Marca de tiempo cuando el voto fue emitido
     * @param vote ID del candidato elegido
     * @param voterHash Hash de la identidad del votante (para privacidad)
     */
    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint256 voteTimestamp;
        uint256 vote;
        bytes32 voterHash;
    }
    
    /**
     * @dev Información completa de una elección
     */
    struct Election {
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        mapping(uint256 => Candidate) candidates;
        uint256 candidateCount;
        uint256 totalVotes;
        mapping(address => Voter) voters;
        address[] voterAddresses;
        bool resultsFinalized;
        address creator;   // Dirección de quien creó la elección
        uint256 createdAt; // Timestamp de creación
        uint256 updatedAt; // Timestamp de última actualización
    }
    
    /**
     * @dev Información de un candidato
     */
    struct Candidate {
        string name;
        string description;
        uint256 voteCount;
        uint256 addedAt; // Timestamp de cuando se añadió el candidato
    }
    
    /**
     * @dev Resumen de elección para funciones de vista
     */
    struct ElectionSummary {
        uint256 id;
        string title;
        string description;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 candidateCount;
        uint256 totalVotes;
        bool resultsFinalized;
        address creator;
        uint256 createdAt;
        uint256 updatedAt;
    }

    // ---- Variables de Estado ----
    
    /// @dev Mapeo de ID de elección a detalles de elección
    mapping(uint256 => Election) public elections;
    
    /// @dev Contador de elecciones (también sirve como próximo ID)
    uint256 public electionCount;
    
    /// @dev Dirección del administrador del contrato
    address public admin;
    
    /// @dev Mapeo de operadores autorizados
    mapping(address => bool) public authorizedOperators;
    
    // ---- Constantes ----
    
    /// @dev Duración mínima de una elección en segundos (1 hora)
    uint256 public constant MIN_ELECTION_DURATION = 3600;
    
    /// @dev Duración máxima de una elección en segundos (30 días)
    uint256 public constant MAX_ELECTION_DURATION = 30 days;
    
    /// @dev Número máximo de candidatos por elección
    uint256 public constant MAX_CANDIDATES_PER_ELECTION = 100;
    
    // ---- Eventos ----
    
    /**
     * @dev Emitido cuando se crea una nueva elección
     */
    event ElectionCreated(
        uint256 indexed electionId,
        string title,
        uint256 startTime,
        uint256 endTime,
        address indexed creator
    );
    
    /**
     * @dev Emitido cuando se actualiza una elección existente
     */
    event ElectionUpdated(
        uint256 indexed electionId,
        string title,
        string description,
        uint256 startTime,
        uint256 endTime,
        address indexed updatedBy
    );
    
    /**
     * @dev Emitido cuando se finaliza una elección
     */
    event ElectionEnded(
        uint256 indexed electionId,
        uint256 endTime,
        address indexed endedBy
    );
    
    /**
     * @dev Emitido cuando se añade un candidato a una elección
     */
    event CandidateAdded(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        address indexed addedBy
    );
    
    /**
     * @dev Emitido cuando se actualiza un candidato
     */
    event CandidateUpdated(
        uint256 indexed electionId,
        uint256 indexed candidateId,
        string name,
        address indexed updatedBy
    );
    
    /**
     * @dev Emitido cuando se registra un votante para una elección
     */
    event VoterRegistered(
        uint256 indexed electionId,
        address indexed voter,
        address indexed registeredBy
    );
    
    /**
     * @dev Emitido cuando se elimina un votante de una elección
     */
    event VoterRemoved(
        uint256 indexed electionId,
        address indexed voter,
        address indexed removedBy
    );
    
    /**
     * @dev Emitido cuando un votante emite su voto
     */
    event VoteCast(
        uint256 indexed electionId,
        address indexed voter,
        uint256 timestamp
    );
    
    /**
     * @dev Emitido cuando se finalizan los resultados de una elección
     */
    event ElectionFinalized(
        uint256 indexed electionId,
        uint256 totalVotes,
        address indexed finalizedBy
    );
    
    /**
     * @dev Emitido cuando se añade un nuevo operador autorizado
     */
    event OperatorAdded(
        address indexed operator,
        address indexed addedBy
    );
    
    /**
     * @dev Emitido cuando se elimina un operador autorizado
     */
    event OperatorRemoved(
        address indexed operator,
        address indexed removedBy
    );
    
    /**
     * @dev Emitido en caso de eventos administrativos críticos
     */
    event AdminAction(
        string action,
        address indexed admin,
        uint256 timestamp
    );
    
    // ---- Modificadores ----
    
    /**
     * @dev Restringe la función solo al administrador
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "VotingSystem: solo el administrador puede realizar esta accion");
        _;
    }
    
    /**
     * @dev Restringe la función a administradores u operadores autorizados
     */
    modifier onlyAuthorized() {
        require(
            msg.sender == admin || authorizedOperators[msg.sender],
            "VotingSystem: requiere autorizacion"
        );
        _;
    }
    
    /**
     * @dev Verifica que la elección exista
     */
    modifier electionExists(uint256 _electionId) {
        require(_electionId < electionCount, "VotingSystem: la eleccion no existe");
        _;
    }
    
    /**
     * @dev Verifica que la elección esté activa
     */
    modifier electionActive(uint256 _electionId) {
        require(elections[_electionId].isActive, "VotingSystem: la eleccion no esta activa");
        require(
            block.timestamp >= elections[_electionId].startTime,
            "VotingSystem: la eleccion aun no ha comenzado"
        );
        require(
            block.timestamp <= elections[_electionId].endTime,
            "VotingSystem: la eleccion ha finalizado"
        );
        _;
    }
    
    /**
     * @dev Verifica que la elección no haya comenzado aún
     */
    modifier electionNotStarted(uint256 _electionId) {
        require(
            block.timestamp < elections[_electionId].startTime,
            "VotingSystem: la eleccion ya ha comenzado"
        );
        _;
    }
    
    /**
     * @dev Verifica que la elección haya finalizado
     */
    modifier electionEnded(uint256 _electionId) {
        require(
            !elections[_electionId].isActive || block.timestamp > elections[_electionId].endTime,
            "VotingSystem: la eleccion aun esta activa"
        );
        _;
    }
    
    /**
     * @dev Previene reentrancy attacks
     */
    uint256 private _reentrancyGuard;
    modifier nonReentrant() {
        require(_reentrancyGuard == 0, "VotingSystem: reentrada no permitida");
        _reentrancyGuard = 1;
        _;
        _reentrancyGuard = 0;
    }
    
    /**
     * @dev Constructor - establece el creador como administrador inicial
     */
    constructor() {
        admin = msg.sender;
        electionCount = 0;
        _reentrancyGuard = 0;
        emit AdminAction("Contrato inicializado", msg.sender, block.timestamp);
    }
    
    // ---- Funciones de Gestión de Elecciones ----
    
    /**
     * @dev Crea una nueva elección
     * @param _title Título de la elección
     * @param _description Descripción de la elección
     * @param _startTime Timestamp de inicio (unix)
     * @param _endTime Timestamp de finalización (unix)
     * @return ID de la elección creada
     */
    function createElection(
        string memory _title,
        string memory _description,
        uint256 _startTime,
        uint256 _endTime
    ) public onlyAuthorized nonReentrant returns (uint256) {
        require(bytes(_title).length > 0, "VotingSystem: el titulo no puede estar vacio");
        require(bytes(_description).length > 0, "VotingSystem: la descripcion no puede estar vacia");
        require(_startTime > block.timestamp, "VotingSystem: la hora de inicio debe ser en el futuro");
        require(_endTime > _startTime, "VotingSystem: la hora de fin debe ser posterior a la hora de inicio");
        require(
            _endTime - _startTime >= MIN_ELECTION_DURATION,
            "VotingSystem: duracion muy corta"
        );
        require(
            _endTime - _startTime <= MAX_ELECTION_DURATION,
            "VotingSystem: duracion muy larga"
        );
        
        uint256 electionId = electionCount;
        
        Election storage e = elections[electionId];
        e.title = _title;
        e.description = _description;
        e.startTime = _startTime;
        e.endTime = _endTime;
        e.isActive = true;
        e.candidateCount = 0;
        e.totalVotes = 0;
        e.resultsFinalized = false;
        e.creator = msg.sender;
        e.createdAt = block.timestamp;
        e.updatedAt = block.timestamp;
        
        electionCount++;
        
        emit ElectionCreated(electionId, _title, _startTime, _endTime, msg.sender);
        
        return electionId;
    }
    
    /**
     * @dev Actualiza una elección existente
     * @param _electionId ID de la elección a actualizar
     * @param _title Nuevo título (opcional)
     * @param _description Nueva descripción (opcional)
     */
    function updateElection(
        uint256 _electionId,
        string memory _title,
        string memory _description
    ) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        electionNotStarted(_electionId) 
    {
        Election storage e = elections[_electionId];
        
        if (bytes(_title).length > 0) {
            e.title = _title;
        }
        
        if (bytes(_description).length > 0) {
            e.description = _description;
        }
        
        e.updatedAt = block.timestamp;
        
        emit ElectionUpdated(
            _electionId,
            e.title,
            e.description,
            e.startTime,
            e.endTime,
            msg.sender
        );
    }
    
    /**
     * @dev Añade un candidato a una elección
     * @param _electionId ID de la elección
     * @param _name Nombre del candidato
     * @param _description Descripción del candidato
     * @return ID del candidato añadido
     */
    function addCandidate(
        uint256 _electionId,
        string memory _name,
        string memory _description
    ) public onlyAuthorized electionExists(_electionId) electionNotStarted(_electionId) returns (uint256) {
        require(!elections[_electionId].resultsFinalized, "VotingSystem: resultados finalizados");
        require(bytes(_name).length > 0, "VotingSystem: el nombre no puede estar vacio");
        require(bytes(_description).length > 0, "VotingSystem: la descripcion no puede estar vacia");
        require(
            elections[_electionId].candidateCount < MAX_CANDIDATES_PER_ELECTION,
            "VotingSystem: limite de candidatos alcanzado"
        );
        
        uint256 candidateId = elections[_electionId].candidateCount;
        
        elections[_electionId].candidates[candidateId] = Candidate({
            name: _name,
            description: _description,
            voteCount: 0,
            addedAt: block.timestamp
        });
        
        elections[_electionId].candidateCount++;
        elections[_electionId].updatedAt = block.timestamp;
        
        emit CandidateAdded(_electionId, candidateId, _name, msg.sender);
        
        return candidateId;
    }
