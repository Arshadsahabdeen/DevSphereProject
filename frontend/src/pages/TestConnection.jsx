import { useState } from 'react';
import axios from 'axios';

const TestConnection = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testBackend = async () => {
    setLoading(true);
    setResult('Testing...\n');
    
    try {
      // Test 1: Root endpoint
      const res1 = await axios.get('http://localhost:5000');
      setResult(prev => prev + `✓ Backend is running: ${JSON.stringify(res1.data)}\n`);
      
      // Test 2: Register
      const testEmail = `test${Date.now()}@example.com`;
      const res2 = await axios.post('http://localhost:5000/api/users/register', {
        name: 'Test User',
        email: testEmail,
        password: 'test123'
      });
      setResult(prev => prev + `✓ Register works: ${JSON.stringify(res2.data)}\n`);
      
      // Test 3: Login
      const res3 = await axios.post('http://localhost:5000/api/users/login', {
        email: testEmail,
        password: 'test123'
      });
      setResult(prev => prev + `✓ Login works: ${JSON.stringify(res3.data)}\n`);
      
      setResult(prev => prev + '\n✓ All tests passed! Backend is working correctly.');
    } catch (err) {
      setResult(prev => prev + `\n✗ Error: ${err.message}\n${err.response?.data?.message || ''}`);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-4">Connection Test</h1>
        <button
          onClick={testBackend}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg mb-4"
        >
          {loading ? 'Testing...' : 'Test Backend Connection'}
        </button>
        <pre className="bg-gray-800 text-green-400 p-4 rounded-lg whitespace-pre-wrap">
          {result || 'Click the button to test backend connection'}
        </pre>
      </div>
    </div>
  );
};

export default TestConnection;
