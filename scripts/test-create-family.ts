import { config } from 'dotenv';

config({ path: '.env.local' });

import { createFamily } from '../src/server/services/family-service';

async function main() {
  try {
    const result = await createFamily({
      familyName: 'Testgezin',
      city: 'Utrecht',
      email: 'testgezin@example.com',
      password: 'Password123!',
    });
    console.log('Created family:', result);
  } catch (error) {
    console.error('Error creating family:', error);
  }
}

void main();
