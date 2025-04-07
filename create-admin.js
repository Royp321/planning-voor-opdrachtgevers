// create-admin.js
import { hashPassword } from './server/auth.js';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

async function hashPasswordLocal(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    const hashedPassword = await hashPasswordLocal('admin123');
    
    await db.insert(users).values({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: 'admin'
    });
    
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdminUser();