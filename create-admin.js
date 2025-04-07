// Script to create an admin user with known credentials
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

// Configure neon to use ws WebSocket implementation
neonConfig.webSocketConstructor = ws;

// Hash password utility function
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not set.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  try {
    // Check if admin user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', ['admin']);
    
    if (existingUser.rows.length > 0) {
      console.log('Admin user already exists. Updating password...');
      
      // Update the admin password
      const hashedPassword = await hashPassword('admin123');
      await pool.query(
        'UPDATE users SET password = $1 WHERE username = $2',
        [hashedPassword, 'admin']
      );
      
      console.log('Admin password updated successfully.');
    } else {
      console.log('Creating new admin user...');
      
      // Create admin user
      const hashedPassword = await hashPassword('admin123');
      await pool.query(
        'INSERT INTO users (username, full_name, email, password, role) VALUES ($1, $2, $3, $4, $5)',
        ['admin', 'Admin User', 'admin@spar-tec.nl', hashedPassword, 'beheerder']
      );
      
      console.log('Admin user created successfully.');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

createAdminUser()
  .then(() => {
    console.log('Script completed.');
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });