'use client';

import { useEffect, useState } from 'react';
import { db, getFirebaseDb } from '@/lib/firebase';

export default function TestFirebasePage() {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        setStatus('Testing Firebase connection...');
        setDetails('Starting connection test...');
        
        // Check if db is available directly
        setDetails(`Direct db check: ${db ? 'Available' : 'Not available'}`);
        
        if (!db) {
          // Try to initialize through the getter function
          setDetails('Attempting to initialize through getter function...');
          const firebaseDb = getFirebaseDb();
          setDetails(`Getter function result: ${firebaseDb ? 'Available' : 'Not available'}`);
          
          if (!firebaseDb) {
            setError('Firebase not initialized');
            setStatus('Firebase not initialized');
            return;
          }
        }
        
        setStatus('Firebase connection successful!');
        setDetails('Firebase is properly initialized and connected');
      } catch (err) {
        console.error('Firebase connection error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setStatus('Firebase connection failed');
        setDetails('Check console for detailed error information');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Firebase Connection Test</h1>
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="mb-4">
          <p className="mb-2"><strong>Status:</strong> <span className={status.includes('successful') ? 'text-green-600' : status.includes('failed') ? 'text-red-600' : 'text-blue-600'}>{status}</span></p>
          {error && <p className="text-red-500 mb-2"><strong>Error:</strong> {error}</p>}
          <p className="mb-2"><strong>Details:</strong> {details}</p>
        </div>
        <div className="mt-6 p-4 bg-gray-50 rounded">
          <h2 className="text-lg font-semibold mb-2">Next Steps:</h2>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
            <li>Check browser console for detailed error messages</li>
            <li>Verify Firebase configuration in .env.local</li>
            <li>Ensure Firebase project exists and is properly configured</li>
          </ul>
        </div>
      </div>
    </div>
  );
}