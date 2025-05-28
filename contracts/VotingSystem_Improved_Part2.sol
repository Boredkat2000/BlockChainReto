    /**
     * @dev Actualiza un candidato existente
     * @param _electionId ID de la elecciu00f3n
     * @param _candidateId ID del candidato
     * @param _name Nuevo nombre del candidato
     * @param _description Nueva descripciu00f3n del candidato
     */
    function updateCandidate(
        uint256 _electionId,
        uint256 _candidateId,
        string memory _name,
        string memory _description
    ) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        electionNotStarted(_electionId) 
    {
        require(!elections[_electionId].resultsFinalized, "VotingSystem: resultados finalizados");
        require(_candidateId < elections[_electionId].candidateCount, "VotingSystem: candidato invalido");
        
        if (bytes(_name).length > 0) {
            elections[_electionId].candidates[_candidateId].name = _name;
        }
        
        if (bytes(_description).length > 0) {
            elections[_electionId].candidates[_candidateId].description = _description;
        }
        
        elections[_electionId].updatedAt = block.timestamp;
        
        emit CandidateUpdated(_electionId, _candidateId, _name, msg.sender);
    }
    
    /**
     * @dev Finaliza una elecciu00f3n antes de tiempo
     * @param _electionId ID de la elecciu00f3n a finalizar
     */
    function endElection(uint256 _electionId) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
    {
        require(elections[_electionId].isActive, "VotingSystem: la eleccion ya esta inactiva");
        
        elections[_electionId].isActive = false;
        elections[_electionId].endTime = block.timestamp;
        elections[_electionId].updatedAt = block.timestamp;
        
        emit ElectionEnded(_electionId, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Finaliza los resultados de una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     */
    function finalizeResults(uint256 _electionId) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        electionEnded(_electionId) 
    {
        require(!elections[_electionId].resultsFinalized, "VotingSystem: resultados ya finalizados");
        
        elections[_electionId].resultsFinalized = true;
        elections[_electionId].updatedAt = block.timestamp;
        
        emit ElectionFinalized(_electionId, elections[_electionId].totalVotes, msg.sender);
    }
    
    // ---- Funciones de Gestiu00f3n de Votantes ----
    
    /**
     * @dev Registra un votante para una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante
     * @param _voterHash Hash u00fanico del votante para verificaciu00f3n
     */
    function registerVoter(uint256 _electionId, address _voter, bytes32 _voterHash) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        nonReentrant 
    {
        require(elections[_electionId].isActive, "VotingSystem: eleccion inactiva");
        require(_voter != address(0), "VotingSystem: direccion invalida");
        require(!elections[_electionId].voters[_voter].isRegistered, "VotingSystem: votante ya registrado");
        
        elections[_electionId].voters[_voter] = Voter({
            isRegistered: true,
            hasVoted: false,
            voteTimestamp: 0,
            vote: 0,
            voterHash: _voterHash
        });
        
        elections[_electionId].voterAddresses.push(_voter);
        elections[_electionId].updatedAt = block.timestamp;
        
        emit VoterRegistered(_electionId, _voter, msg.sender);
    }
    
    /**
     * @dev Registra mu00faltiples votantes para una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @param _voters Array de direcciones de votantes
     * @param _voterHashes Array de hashes de votantes
     */
    function batchRegisterVoters(
        uint256 _electionId, 
        address[] memory _voters, 
        bytes32[] memory _voterHashes
    ) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        nonReentrant 
    {
        require(elections[_electionId].isActive, "VotingSystem: eleccion inactiva");
        require(_voters.length == _voterHashes.length, "VotingSystem: longitudes no coinciden");
        require(_voters.length <= 100, "VotingSystem: demasiados votantes por lote");
        
        for (uint256 i = 0; i < _voters.length; i++) {
            address voter = _voters[i];
            bytes32 voterHash = _voterHashes[i];
            
            require(voter != address(0), "VotingSystem: direccion invalida");
            
            // Si el votante ya estu00e1 registrado, omitirlo silenciosamente
            if (!elections[_electionId].voters[voter].isRegistered) {
                elections[_electionId].voters[voter] = Voter({
                    isRegistered: true,
                    hasVoted: false,
                    voteTimestamp: 0,
                    vote: 0,
                    voterHash: voterHash
                });
                
                elections[_electionId].voterAddresses.push(voter);
                
                emit VoterRegistered(_electionId, voter, msg.sender);
            }
        }
        
        elections[_electionId].updatedAt = block.timestamp;
    }
    
    /**
     * @dev Elimina un votante de una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante a eliminar
     */
    function removeVoter(uint256 _electionId, address _voter) 
        public 
        onlyAuthorized 
        electionExists(_electionId) 
        electionNotStarted(_electionId) 
    {
        require(elections[_electionId].voters[_voter].isRegistered, "VotingSystem: votante no registrado");
        require(!elections[_electionId].voters[_voter].hasVoted, "VotingSystem: el votante ya ha votado");
        
        // Marcar como no registrado
        elections[_electionId].voters[_voter].isRegistered = false;
        
        // Nota: No eliminamos la direcciu00f3n del array ya que eso requeriru00eda reestructurar todo el array
        // En lugar de eso, simplemente la marcamos como no registrada
        
        elections[_electionId].updatedAt = block.timestamp;
        
        emit VoterRemoved(_electionId, _voter, msg.sender);
    }
    
    /**
     * @dev Emite un voto en una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @param _candidateId ID del candidato elegido
     */
    function castVote(uint256 _electionId, uint256 _candidateId) 
        public 
        electionExists(_electionId) 
        electionActive(_electionId) 
        nonReentrant 
    {
        require(elections[_electionId].voters[msg.sender].isRegistered, "VotingSystem: votante no registrado");
        require(!elections[_electionId].voters[msg.sender].hasVoted, "VotingSystem: ya ha votado");
        require(_candidateId < elections[_electionId].candidateCount, "VotingSystem: candidato invalido");
        
        // Actualizar estado del votante
        elections[_electionId].voters[msg.sender].hasVoted = true;
        elections[_electionId].voters[msg.sender].voteTimestamp = block.timestamp;
        elections[_electionId].voters[msg.sender].vote = _candidateId;
        
        // Incrementar conteo de votos
        elections[_electionId].candidates[_candidateId].voteCount++;
        elections[_electionId].totalVotes++;
        elections[_electionId].updatedAt = block.timestamp;
        
        emit VoteCast(_electionId, msg.sender, block.timestamp);
    }
    
    // ---- Funciones de Administraciu00f3n ----
    
    /**
     * @dev Transfiere la propiedad del contrato a una nueva direcciu00f3n
     * @param _newAdmin Direcciu00f3n del nuevo administrador
     */
    function transferAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "VotingSystem: direccion invalida");
        require(_newAdmin != admin, "VotingSystem: ya es el administrador");
        
        address oldAdmin = admin;
        admin = _newAdmin;
        
        emit AdminAction("Administrador transferido", oldAdmin, block.timestamp);
    }
    
    /**
     * @dev Au00f1ade un operador autorizado
     * @param _operator Direcciu00f3n del operador a autorizar
     */
    function addOperator(address _operator) public onlyAdmin {
        require(_operator != address(0), "VotingSystem: direccion invalida");
        require(!authorizedOperators[_operator], "VotingSystem: ya es operador");
        
        authorizedOperators[_operator] = true;
        
        emit OperatorAdded(_operator, msg.sender);
    }
    
    /**
     * @dev Elimina un operador autorizado
     * @param _operator Direcciu00f3n del operador a eliminar
     */
    function removeOperator(address _operator) public onlyAdmin {
        require(authorizedOperators[_operator], "VotingSystem: no es operador");
        
        authorizedOperators[_operator] = false;
        
        emit OperatorRemoved(_operator, msg.sender);
    }
    
    // ---- Funciones de Vista ----
    
    /**
     * @dev Obtiene un resumen de una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @return Estructura ElectionSummary con los datos
     */
    function getElectionSummary(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId) 
        returns (ElectionSummary memory) 
    {
        Election storage e = elections[_electionId];
        
        return ElectionSummary({
            id: _electionId,
            title: e.title,
            description: e.description,
            startTime: e.startTime,
            endTime: e.endTime,
            isActive: e.isActive,
            candidateCount: e.candidateCount,
            totalVotes: e.totalVotes,
            resultsFinalized: e.resultsFinalized,
            creator: e.creator,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt
        });
    }
    
    /**
     * @dev Obtiene informaciu00f3n de un candidato
     * @param _electionId ID de la elecciu00f3n
     * @param _candidateId ID del candidato
     * @return Nombre, descripciu00f3n y nu00famero de votos del candidato
     */
    function getCandidate(uint256 _electionId, uint256 _candidateId) 
        public 
        view 
        electionExists(_electionId) 
        returns (string memory, string memory, uint256) 
    {
        require(_candidateId < elections[_electionId].candidateCount, "VotingSystem: candidato invalido");
        
        Candidate storage c = elections[_electionId].candidates[_candidateId];
        
        return (c.name, c.description, c.voteCount);
    }
    
    /**
     * @dev Obtiene el estado de un votante
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante
     * @return Si estu00e1 registrado y si ha votado
     */
    function getVoterStatus(uint256 _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId) 
        returns (bool, bool) 
    {
        Voter storage v = elections[_electionId].voters[_voter];
        
        return (v.isRegistered, v.hasVoted);
    }
    
    /**
     * @dev Obtiene informaciu00f3n detallada de un votante
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante
     * @return Registrado, ha votado, timestamp del voto
     */
    function getVoterDetails(uint256 _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId) 
        returns (bool, bool, uint256) 
    {
        Voter storage v = elections[_electionId].voters[_voter];
        
        return (v.isRegistered, v.hasVoted, v.voteTimestamp);
    }
    
    /**
     * @dev Obtiene el conteo de votantes registrados
     * @param _electionId ID de la elecciu00f3n
     * @return Nu00famero de votantes registrados
     */
    function getRegisteredVoterCount(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId) 
        returns (uint256) 
    {
        return elections[_electionId].voterAddresses.length;
    }
    
    /**
     * @dev Obtiene el conteo de votantes que han emitido su voto
     * @param _electionId ID de la elecciu00f3n
     * @return Nu00famero de votantes que han votado
     */
    function getVotedCount(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId) 
        returns (uint256) 
    {
        uint256 count = 0;
        for (uint256 i = 0; i < elections[_electionId].voterAddresses.length; i++) {
            address voter = elections[_electionId].voterAddresses[i];
            if (elections[_electionId].voters[voter].hasVoted) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Obtiene los resultados de una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @return Array con los votos de cada candidato
     */
    function getElectionResults(uint256 _electionId) 
        public 
        view 
        electionExists(_electionId) 
        returns (uint256[] memory) 
    {
        require(
            elections[_electionId].resultsFinalized || block.timestamp > elections[_electionId].endTime, 
            "VotingSystem: resultados no disponibles"
        );
        
        uint256[] memory results = new uint256[](elections[_electionId].candidateCount);
        
        for (uint256 i = 0; i < elections[_electionId].candidateCount; i++) {
            results[i] = elections[_electionId].candidates[i].voteCount;
        }
        
        return results;
    }
    
    /**
     * @dev Verifica si un votante estu00e1 registrado en una elecciu00f3n
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante
     * @return True si el votante estu00e1 registrado
     */
    function isRegisteredVoter(uint256 _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId) 
        returns (bool) 
    {
        return elections[_electionId].voters[_voter].isRegistered;
    }
    
    /**
     * @dev Verifica si un votante ya ha emitido su voto
     * @param _electionId ID de la elecciu00f3n
     * @param _voter Direcciu00f3n del votante
     * @return True si el votante ya ha votado
     */
    function hasVoted(uint256 _electionId, address _voter) 
        public 
        view 
        electionExists(_electionId) 
        returns (bool) 
    {
        return elections[_electionId].voters[_voter].hasVoted;
    }
}
