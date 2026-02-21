# Firebase Integration Setup

This project has been integrated with Firebase for authentication and data storage. Here's how to set it up:

## Prerequisites

1. Firebase project created at [Firebase Console](https://console.firebase.google.com/)
2. Firebase project ID: `premvision-46163`

## Setup Steps

### 1. Enable Firebase Services

In your Firebase Console, enable the following services:

- **Authentication**: Enable Email/Password authentication AND Google authentication
- **Firestore Database**: Create a database in production mode
- **Hosting**: Enable web hosting

### 2. Deploy Firestore Rules

```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase in the project (if not already done)
firebase init

# Deploy Firestore rules
firebase deploy --only firestore:rules
```

### 3. Deploy Firestore Indexes

```bash
firebase deploy --only firestore:indexes
```

### 4. Deploy to Firebase Hosting

```bash
# Build the project
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

## Features Implemented

### Authentication
- User registration with email/password
- Google sign-in (one-click authentication)
- User login/logout
- Profile management
- Automatic user profile creation in Firestore

### Data Storage
- User teams and formations
- Player data management
- Transfer history
- League management
- Real-time data synchronization

### Security
- Firestore security rules
- User data isolation
- Authenticated access control

## File Structure

```
frontend/
├── src/lib/
│   ├── firebase.ts          # Firebase configuration
│   ├── firebase-auth.ts     # Authentication service
│   └── firebase-storage.ts  # Data storage service
├── firebase.json            # Firebase project configuration
├── firestore.rules          # Security rules
└── firestore.indexes.json   # Database indexes
```

## Usage

The Firebase integration is now active in your application. Users can:

1. **Register/Login**: Use email and password authentication
2. **Manage Teams**: Save and load team formations
3. **Track Transfers**: Monitor player transfer history
4. **Join Leagues**: Participate in FPL leagues
5. **Real-time Updates**: Get live data synchronization

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Check if Firebase Authentication is enabled
2. **Permission Denied**: Verify Firestore rules are deployed correctly
3. **Index Errors**: Ensure all required indexes are created

### Debug Mode

Enable debug logging by adding this to your browser console:
```javascript
localStorage.setItem('firebase:debug', '*');
```

## Next Steps

1. Deploy the Firestore rules and indexes
2. Test user registration and login
3. Verify data persistence across sessions
4. Monitor Firebase Console for usage analytics
