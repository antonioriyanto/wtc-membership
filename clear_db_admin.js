const admin = require('firebase-admin');

// Ensure firebase-admin is available (usually is not in this environment by default, 
// but we'll try to rely on the user doing it from the Firebase console instead 
// since we don't have the Service Account Key here).
