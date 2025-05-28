import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

// Import components
import Navbar from './components/layout/Navbar';
import Home from './components/pages/Home';
import ElectionList from './components/elections/ElectionList';
import ElectionDetails from './components/elections/ElectionDetails';
import CreateElection from './components/admin/CreateElection';
import EditElection from './components/admin/EditElection';
import ElectionDetailAdmin from './components/admin/ElectionDetailAdmin';
import AdminDashboard from './components/admin/AdminDashboard';
import ManageVoters from './components/admin/ManageVoters';
import ElectionStatistics from './components/admin/ElectionStatistics';
import Login from './components/auth/Login';
import IdLogin from './components/auth/IdLogin';
import ConnectWallet from './components/auth/ConnectWallet';
import AdminLogin from './components/admin/AdminLogin';
import AdminRoute from './components/routing/AdminRoute';
import VotingInterface from './components/voting/VotingInterface';
import ElectionResults from './components/elections/ElectionResults';
import Footer from './components/layout/Footer';

// Import context
import AuthContext from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';

// Import styles
import './App.css';

// Import utilities
import { getContractInstance } from './utils/contractUtils';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [userName, setUserName] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);

  // Define logout function first to avoid reference issues
  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_address');
    localStorage.removeItem('user_name');
    setIsAuthenticated(false);
    setUserAddress(null);
    setUserName(null);
    setIsAdmin(false);
  }, []);

  // Define initEthereumProvider using useCallback to prevent recreating it on each render
  const initEthereumProvider = useCallback(async () => {
    try {
      // Check if MetaMask is installed
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        
        // Initialize contract instance
        const contractInstance = await getContractInstance(provider, signer);
        setContract(contractInstance);
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length === 0) {
            // User disconnected their wallet
            logout();
          } else if (isAuthenticated) {
            // User switched accounts while logged in, require re-authentication
            toast.info("Wallet account changed. Please log in again.");
            logout();
          }
        });
        
        // Listen for chain changes
        window.ethereum.on('chainChanged', () => {
          window.location.reload();
        });
      } else {
        toast.error("MetaMask not detected. Please install MetaMask to use this application.");
      }
    } catch (error) {
      console.error('Error initializing Ethereum provider:', error);
      toast.error('Failed to connect to blockchain network');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, logout]);
  
  // Login function defined before useEffect
  const login = useCallback((address, token, name) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user_address', address);
    localStorage.setItem('user_name', name || 'Usuario');
    setIsAuthenticated(true);
    setUserAddress(address);
    setUserName(name || 'Usuario');
    
    // Check if user is admin
    const adminAddress = process.env.REACT_APP_ADMIN_ADDRESS;
    if (adminAddress && address.toLowerCase() === adminAddress.toLowerCase()) {
      setIsAdmin(true);
    }
  }, []);

  // useEffect hook after all the functions are defined
  useEffect(() => {
    // Check if user is already authenticated (e.g., token exists)
    const token = localStorage.getItem('auth_token');
    const storedAddress = localStorage.getItem('user_address');
    const storedName = localStorage.getItem('user_name');
    
    if (token && storedAddress) {
      setIsAuthenticated(true);
      setUserAddress(storedAddress);
      setUserName(storedName || 'Usuario');
      
      // Check if user is admin (in a real app, this might be a role in JWT)
      const adminAddress = process.env.REACT_APP_ADMIN_ADDRESS;
      if (adminAddress && storedAddress.toLowerCase() === adminAddress.toLowerCase()) {
        setIsAdmin(true);
      }
    }
    
    // Initialize Ethereum provider
    initEthereumProvider();
  }, [initEthereumProvider]);
  // Protected route component
  const ProtectedRoute = ({ children, adminOnly = false }) => {
    if (!isAuthenticated) {
      return <Navigate to="/id-login" />;
    }
    
    if (adminOnly && !isAdmin) {
      return <Navigate to="/" />;
    }
    
    return children;
  };

  if (loading) {
    return <div className="app-loading">Loading blockchain connection...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userAddress, userName, isAdmin, login, logout, provider, signer, contract }}>
      <AdminProvider>
        <div className="app">
          <Navbar />
          <main className="container my-4">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/id-login" element={<IdLogin />} />
              <Route path="/connect-wallet" element={<ConnectWallet />} />
              <Route path="/login" element={<Login />} />
              <Route path="/elections" element={<ElectionList />} />
              <Route path="/elections/:id" element={<ElectionDetails />} />
              <Route path="/elections/:id/results" element={<ElectionResults />} />
              
              {/* Ruta protegida para votantes */}
              <Route path="/elections/:id/vote" element={
                <ProtectedRoute>
                  <VotingInterface />
                </ProtectedRoute>
              } />
              
              {/* Rutas de administrador con sistema separado de autenticación */}
              <Route path="/admin-login" element={<AdminLogin />} />
              
              {/* Rutas protegidas de administrador */}
              <Route path="/admin" element={
                <AdminRoute element={<AdminDashboard />} />
              } />
              <Route path="/admin/create-election" element={
                <AdminRoute element={<CreateElection />} />
              } />
              <Route path="/admin/edit-election/:electionId" element={
                <AdminRoute element={<EditElection />} />
              } />
              <Route path="/admin/elections/:electionId" element={
                <AdminRoute element={<ElectionDetailAdmin />} />
              } />
              <Route path="/admin/election/:electionId/voters" element={
                <AdminRoute element={<ManageVoters />} />
              } />
              <Route path="/admin/election/:electionId/statistics" element={
                <AdminRoute element={<ElectionStatistics />} />
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </AdminProvider>
    </AuthContext.Provider>
  );
}

export default App;
