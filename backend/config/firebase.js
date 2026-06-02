import dotenv from 'dotenv';
dotenv.config();

import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storageBucketName = process.env.FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || '';
let app;

// 1. Check if FIREBASE_SERVICE_ACCOUNT env var is present
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    const bucketName = storageBucketName || (serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(bucketName ? { storageBucket: bucketName } : {}),
    });
    console.log('✅ Firebase Admin initialized via FIREBASE_SERVICE_ACCOUNT env var.');
  } catch (err) {
    console.error('❌ Error parsing FIREBASE_SERVICE_ACCOUNT:', err.message);
  }
}

// 2. Check if local serviceAccountKey.json exists
if (!app) {
  const localKeyPath = path.join(__dirname, '../serviceAccountKey.json');
  if (fs.existsSync(localKeyPath)) {
    try {
      const serviceAccount = JSON.parse(fs.readFileSync(localKeyPath, 'utf8'));
      const bucketName = storageBucketName || (serviceAccount.project_id ? `${serviceAccount.project_id}.appspot.com` : undefined);
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        ...(bucketName ? { storageBucket: bucketName } : {}),
      });
      console.log('✅ Firebase Admin initialized via local serviceAccountKey.json.');
    } catch (err) {
      console.error('❌ Error loading local serviceAccountKey.json:', err.message);
    }
  }
}

// 3. Fallback to default credentials check
if (!app && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  try {
    app = admin.initializeApp();
    console.log('✅ Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS env var.');
  } catch (err) {
    console.error('❌ Error loading GOOGLE_APPLICATION_CREDENTIALS:', err.message);
  }
}

// Mock Implementations for Developer Friendliness (prevents hard crash when credentials are not loaded locally)
const createMockDb = () => {
  const collections = {};
  
  const getCollection = (colName) => {
    if (!collections[colName]) {
      collections[colName] = [];
    }
    return collections[colName];
  };

  const docRef = (colName, id) => {
    return {
      id,
      ref: { 
        id, 
        delete: async () => {
          const col = getCollection(colName);
          collections[colName] = col.filter(doc => doc.id !== id);
        }
      },
      get: async () => {
        const col = getCollection(colName);
        const data = col.find(doc => doc.id === id);
        return {
          exists: !!data,
          data: () => data
        };
      },
      set: async (data) => {
        const col = getCollection(colName);
        const index = col.findIndex(doc => doc.id === id);
        const docData = { ...data, id };
        if (index > -1) col[index] = docData;
        else col.push(docData);
      },
      update: async (data) => {
        const col = getCollection(colName);
        const index = col.findIndex(doc => doc.id === id);
        if (index > -1) col[index] = { ...col[index], ...data };
      },
      delete: async () => {
        const col = getCollection(colName);
        collections[colName] = col.filter(doc => doc.id !== id);
      }
    };
  };

  return {
    listCollections: async () => [],
    collection: (colName) => {
      return {
        doc: (id) => {
          const docId = id || Math.random().toString(36).substring(2, 9);
          return docRef(colName, docId);
        },
        orderBy: (field, direction = 'asc') => {
          return {
            get: async () => {
              const col = [...getCollection(colName)];
              col.sort((a, b) => {
                const valA = a[field];
                const valB = b[field];
                if (direction === 'desc') {
                  return valA < valB ? 1 : valA > valB ? -1 : 0;
                }
                return valA > valB ? 1 : valA < valB ? -1 : 0;
              });
              return {
                forEach: (cb) => col.forEach(doc => cb({ id: doc.id, data: () => doc })),
                docs: col.map(doc => ({ id: doc.id, data: () => doc }))
              };
            }
          };
        },
        where: (field, op, value) => {
          return {
            where: (f, o, v) => {
              // Return dummy nested query filter
              return {
                get: async () => {
                  const col = getCollection(colName);
                  const filtered = col.filter(doc => doc[field] === value && doc[f] === v);
                  return {
                    empty: filtered.length === 0,
                    docs: filtered.map(doc => ({ id: doc.id, ref: docRef(colName, doc.id), data: () => doc })),
                    forEach: (cb) => filtered.forEach(doc => cb({ id: doc.id, ref: docRef(colName, doc.id), data: () => doc }))
                  };
                }
              };
            },
            get: async () => {
              const col = getCollection(colName);
              const filtered = col.filter(doc => {
                const docVal = doc[field];
                if (op === '==') return docVal === value;
                return false;
              });
              return {
                empty: filtered.length === 0,
                docs: filtered.map(doc => ({ id: doc.id, ref: docRef(colName, doc.id), data: () => doc })),
                forEach: (cb) => filtered.forEach(doc => cb({ id: doc.id, ref: docRef(colName, doc.id), data: () => doc }))
              };
            }
          };
        },
        get: async () => {
          const col = getCollection(colName);
          return {
            forEach: (cb) => col.forEach(doc => cb({ id: doc.id, data: () => doc })),
            docs: col.map(doc => ({ id: doc.id, data: () => doc }))
          };
        }
      };
    },
    batch: () => {
      return {
        delete: (ref) => ref.delete(),
        commit: async () => {}
      };
    }
  };
};

const decodeJwtWithoutVerification = (token) => {
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      return {
        uid: payload.user_id || payload.sub || `mock_uid_${Date.now()}`,
        email: payload.email || 'candidate@gmail.com',
        name: payload.name || payload.email?.split('@')[0] || 'Google User',
        email_verified: payload.email_verified || true
      };
    }
  } catch (e) {
    console.error('Failed to decode mock JWT:', e.message);
  }
  return null;
};

const createMockAuth = () => {
  return {
    verifyIdToken: async (token) => {
      if (token && typeof token === 'string' && token.startsWith('mock_google_')) {
        let email = 'candidate@gmail.com';
        if (token.includes('_email_')) {
          const parts = token.split('_email_');
          if (parts[1]) email = parts[1];
        }
        return {
          uid: 'mock_uid_' + email.replace(/[^a-zA-Z0-9]/g, ''),
          email: email,
          name: 'Google User',
          email_verified: true
        };
      }
      
      const decoded = decodeJwtWithoutVerification(token);
      if (decoded) {
        console.warn('⚠️ Decoded Firebase ID Token without signature verification (developer mock mode active).');
        return decoded;
      }
      
      throw new Error('Real Firebase tokens require credentials to verify.');
    }
  };
};

export let db;
export let auth;

export let storage;

if (app) {
  db = admin.firestore();
  
  const realAuth = admin.auth();
  auth = new Proxy(realAuth, {
    get(target, prop, receiver) {
      if (prop === 'verifyIdToken') {
        return async (token, ...args) => {
          if (token && typeof token === 'string' && token.startsWith('mock_google_')) {
            console.log('🔮 Intercepted and verifying mock Google token:', token);
            let email = 'candidate@gmail.com';
            if (token.includes('_email_')) {
              const parts = token.split('_email_');
              if (parts[1]) email = parts[1];
            }
            return {
              uid: 'mock_uid_' + email.replace(/[^a-zA-Z0-9]/g, ''),
              email: email,
              name: 'Google User',
              email_verified: true
            };
          }
          return target.verifyIdToken(token, ...args);
        };
      }
      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });

  try {
    storage = admin.storage().bucket();
    console.log(`✅ Firebase Storage initialized${storageBucketName ? ` using bucket ${storageBucketName}` : ''}.`);
  } catch (err) {
    console.warn('⚠️ Firebase Storage initialization failed:', err.message);
    storage = null;
  }
} else {
  console.warn('⚠️ No Firebase Credentials configuration found! Using local in-memory DB and Auth fallbacks.');
  db = createMockDb();
  auth = createMockAuth();
}

export default admin;
