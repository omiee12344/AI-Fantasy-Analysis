import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';
import { userStore } from '../store/userStore';
import admin from 'firebase-admin';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    // First try to verify as JWT token (existing backend auth)
    const decoded = verifyToken(token);
    if (decoded) {
      const user = userStore.findById(decoded.userId);
      if (user) {
        req.user = {
          id: user.id,
          email: user.email
        };
        return next();
      }
    }

    // If JWT verification fails, try Firebase ID token verification
    try {
      // Initialize Firebase Admin if not already initialized
      if (admin.apps.length === 0) {
        admin.initializeApp({
          projectId: 'premvision-46163'
        });
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebaseUid = decodedToken.uid;
      const firebaseEmail = decodedToken.email;

      // Try to find user by Firebase UID first, then by email
      let user = userStore.findById(firebaseUid);
      
      if (!user && firebaseEmail) {
        user = userStore.findByEmail(firebaseEmail);
      }

      // If user doesn't exist, create a minimal user profile
      if (!user && firebaseEmail) {
        const profile = userStore.createDefaultProfile(
          decodedToken.name?.split(' ')[0] || 'User',
          decodedToken.name?.split(' ').slice(1).join(' ') || '',
          `${decodedToken.name || firebaseEmail}'s Team`,
          undefined
        );

        user = userStore.create({
          id: firebaseUid,
          email: firebaseEmail,
          password: 'firebase-user', // Placeholder for Firebase users
          profile
        });
      }

      if (user) {
        req.user = {
          id: user.id,
          email: user.email
        };
        return next();
      }
    } catch (firebaseError) {
      console.log('Firebase token verification failed:', firebaseError);
    }

    return res.status(401).json({ error: 'Invalid token.' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};