import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Chat from './pages/Chat';
import TestConnection from './pages/TestConnection';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/test" element={<TestConnection />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="projects" element={<Projects />} />
              <Route path="chat" element={<Chat />} />
              <Route path="teams" element={<div className="bg-white rounded-lg shadow-lg p-6"><h1 className="text-2xl font-bold">Teams - Coming Soon</h1></div>} />
              <Route path="notifications" element={<div className="bg-white rounded-lg shadow-lg p-6"><h1 className="text-2xl font-bold">Notifications - Coming Soon</h1></div>} />
              <Route path="profile" element={<div className="bg-white rounded-lg shadow-lg p-6"><h1 className="text-2xl font-bold">Profile - Coming Soon</h1></div>} />
            </Route>
          </Routes>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;