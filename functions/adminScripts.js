/**
 * This file contains administrative scripts using the Firebase Admin SDK
 * to add documents to Firestore collections (agencies, users, bettingHouses, tickets, dailyClosures).
 * These functions would typically be called from Cloud Functions or other trusted server-side environments.
 */

// Import the Firebase Admin SDK
const admin = require('firebase-admin');

// You should have already initialized the Admin SDK elsewhere (e.g., in your index.js for Cloud Functions)
// If not, uncomment and configure the following lines:
/*
const serviceAccount = require('./path/to/your/serviceAccountKey.json'); // Replace with your service account key path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Replace with your Firestore database URL if needed
  // databaseURL: 'https://your-database-name.firebaseio.com'
});
*/

const firestore = admin.firestore();

// Function to create a new agency document
async function createAgency(agencyData) {
  try {
    const docRef = await firestore.collection('agencies').add(agencyData);
    console.log("Agency document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding agency document:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Function to create a new user document
async function createUser(userData) {
  try {
    const docRef = await firestore.collection('users').add(userData);
    console.log("User document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding user document:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Function to create a new betting house document
async function createBettingHouse(bettingHouseData) {
  try {
    const docRef = await firestore.collection('bettingHouses').add(bettingHouseData);
    console.log("Betting house document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding betting house document:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Function to create a new ticket document
async function createTicket(ticketData) {
  try {
    const docRef = await firestore.collection('tickets').add(ticketData);
    console.log("Ticket document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding ticket document:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Function to create a new daily closure document
async function createDailyClosure(closureData) {
  try {
    const docRef = await firestore.collection('dailyClosures').add(closureData);
    console.log("Daily closure document written with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error adding daily closure document:", error);
    throw error; // Re-throw the error for handling in the calling function
  }
}

// Export the function so it can be used in other files (e.g., Cloud Functions)
module.exports = {
  createAgency,
  createUser,
  createBettingHouse,
  createTicket, // Export the new ticket function
  createDailyClosure // Export the new daily closure function
};

// Add functions for creating users, betting houses, tickets, daily closures below.