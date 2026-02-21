import { Router, Request, Response } from 'express';
import { hashPassword, comparePassword, generateToken, sanitizeUser } from '../utils/auth';
import { userStore } from '../store/userStore';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/user';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Register
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, teamName, favouriteTeam, country }: RegisterRequest = req.body;

    // Validation
    if (!email || !password || !firstName || !lastName || !teamName) {
      return res.status(400).json({ 
        error: 'Email, password, first name, last name, and team name are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Check if user already exists
    const existingUser = userStore.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create user
    const hashedPassword = await hashPassword(password);
    const profile = userStore.createDefaultProfile(firstName, lastName, teamName, favouriteTeam);
    
    const user = userStore.create({
      email,
      password: hashedPassword,
      profile: {
        ...profile,
        country
      }
    });

    // Generate token
    const token = generateToken(user.id);

    const response: AuthResponse = {
      token,
      user: sanitizeUser(user)
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = userStore.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    const response: AuthResponse = {
      token,
      user: sanitizeUser(user)
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/auth/profile', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = userStore.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(user));
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/auth/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const updates = req.body;
    const allowedUpdates = ['profile'];
    const actualUpdates: any = {};

    // Only allow updates to profile fields
    if (updates.profile) {
      actualUpdates.profile = updates.profile;
    }

    const updatedUser = userStore.update(req.user.id, actualUpdates);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(sanitizeUser(updatedUser));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;