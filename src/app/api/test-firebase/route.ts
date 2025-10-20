import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    // Test if db is initialized
    if (!db) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Firebase not initialized',
          details: 'The Firestore database instance is not available'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Try to perform a simple operation
    const testCollection = collection(db, 'test');
    const snapshot = await getDocs(testCollection);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Firebase connection successful',
        documentCount: snapshot.size
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Firebase test error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Firebase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}