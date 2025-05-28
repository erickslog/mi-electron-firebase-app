const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();
const { defineSecret } = require('firebase-functions/v2/params');

// Define a secret for the Lotto Activo API Key
const lottoActivoApiKey = defineSecret('LOTTO_ACTIVO_API_KEY'); // Replace 'LOTTO_ACTIVO_API_KEY' with the actual secret name in Secret Manager


exports.processTransaction = functions.https.onCall(async (data, context) => {
  // Authentication check (optional but recommended for secure functions)

  try {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
  // Destructure and validate input data with more detail
  const { hours, plays } = data; // Assuming data structure now matches the Ticket model's subcollection
  if (!hours || !Array.isArray(hours) || hours.length === 0) {
 throw new functions.https.HttpsError('invalid-argument', 'Invalid or missing selected hours.');
  }

  if (!plays || !Array.isArray(plays) || plays.length === 0 || plays.some(play => !play.bettingHouseId || !play.drawTime || !play.playType || !play.playInput || typeof play.totalPlayAmount !== 'number' || play.totalPlayAmount <= 0)) {
 throw new functions.https.HttpsError('invalid-argument', 'Invalid or missing plays data.');
  }

 if (typeof data.totalAmountBs !== 'number' || data.totalAmountBs < 0 || typeof data.totalAmountUsd !== 'number' || data.totalAmountUsd < 0) {
 throw new functions.https.HttpsError('invalid-argument', 'Invalid total amounts.');
 }


    // Get a reference to the Firestore database
 const firestore = admin.firestore();
 const { exchangeRate, currencyUsed } = data; // Destructure here
    // Create a batched write for saving the ticket and plays
    const batch = firestore.batch();
 const ticketRef = firestore.collection('tickets').doc();
 // Prepare the main ticket data (add more fields as per your model)
 const ticketData = {
    agencyId: context.auth.token.agencyId || null, // Assuming agencyId is in auth token or can be fetched from user doc
    cashierId: context.auth.uid,
 timestamp: admin.firestore.FieldValue.serverTimestamp(),
 totalAmountBs: data.totalAmountBs,
 totalAmountUsd: data.totalAmountUsd,
 currencyUsed: data.currencyUsed,
    exchangeRate: exchangeRate,
    status: 'active',
    clientTicketNumber: 'GENERATED_CLIENT_TICKET_NUMBER', // Implement logic to generate
    hours: hours, // Add selected hours to the ticket document
 };

 batch.set(ticketRef, ticketData);

 plays.forEach(play => {
      const playRef = ticketRef.collection('plays').doc();
      batch.set(playRef, {
      ...play, // Include fields like bettingHouseId, drawTime, playType, etc.
        currency: currencyUsed // Use the same currency as the ticket for simplicity, adjust if needed
      });
    });

    // Array to store results of API calls for each play
    const apiResponses = [];

    // --- Begin: Process Each Play and Call External API ---
    for (const play of plays) {
      // 1. Get the sportsbook API configuration
      const bettingHouseRef = firestore.collection('bettingHouses').doc(play.bettingHouseId);
      const bettingHouseDoc = await bettingHouseRef.get();

      if (!bettingHouseDoc.exists || bettingHouseDoc.data().status !== 'active') {
        throw new functions.https.HttpsError('invalid-argument', `Invalid or inactive betting house for play: ${play.bettingHouseId}`);
      }

      const bettingHouseData = bettingHouseDoc.data();
      const apiConfig = bettingHouseData.apiConfig;

      if (!apiConfig || !apiConfig.apiKeySecretName || !apiConfig.ipAddress || !apiConfig.port) {
        throw new functions.https.HttpsError('internal', `API configuration is incomplete for betting house: ${play.bettingHouseId}`);
      }

      // 2. Retrieve the apiKey from Firebase Secret Manager
      let apiKey;
      try {
        // Access the secret value from Secret Manager.
        // The secret name is stored in the bettingHouse document.
        // This assumes you have set up the secret in Firebase Secret Manager
        // and granted your Cloud Functions service account permission to access it.
        // Replace this placeholder with the actual Secret Manager access code.
        // Example using firebase-functions/v2/params.defineSecret
        // const secretValue = await apiConfig.apiKeySecretName.value();
        apiKey = 'YOUR_MOCKED_API_KEY_FROM_SECRET_MANAGER'; // Replace with actual secret access

         if (apiKey === 'YOUR_MOCKED_API_KEY_FROM_SECRET_MANAGER') {
             console.warn(`Using mocked API key for betting house: ${play.bettingHouseId}`);
         }

      } catch (secretError) {
        console.error('Error accessing API key from Secret Manager:', secretError);
        throw new functions.https.HttpsError('internal', 'Failed to access API key for betting provider.');
      }

      // 3. Make the call to the provider's API to register the bet (or Mock)
      let apiResponse;
      try {
        // This is a placeholder for the actual API call logic.
        // You would use a library like 'axios' or Node.js's built-in 'http' or 'https'
        // to make the request to apiConfig.ipAddress:apiConfig.port with the apiKey
        // and the play data.
        console.log(`Mocking API call for betting house ${play.bettingHouseId}, draw ${play.drawTime}, play ${play.playInput}`);
        // Mock API call response for development
        apiResponse = { success: true, providerTicketId: 'MOCKED_PROVIDER_ID_' + Math.random().toString(36).substring(7) };

        // Example of a real API call placeholder:
        /*
        const axios = require('axios');
        const apiUrl = `http://${apiConfig.ipAddress}:${apiConfig.port}/submit-bet`; // Adjust endpoint as needed
        const apiRequestBody = { playData: play, ticketDetails: data }; // Construct request body as required by the provider

        apiResponse = await axios.post(apiUrl, apiRequestBody, {
          headers: { 'Authorization': `Bearer ${apiKey}` } // Adjust headers as required by the provider
        });
        */

        if (!apiResponse || !apiResponse.success) {
          throw new Error('API call reported failure'); // Throw an error if the API indicates failure
        }
        apiResponses.push(apiResponse); // Store successful API response
      } catch (apiCallError) {
        console.error(`Error calling API for betting house ${play.bettingHouseId}:`, apiCallError);
        // If the provider's API fails for any play, the entire transaction should fail
        throw new functions.https.HttpsError('unavailable', `Failed to register bet with provider for play: ${play.bettingHouseId}. ${apiCallError.message}`);
      }
    }
    // --- End: Process Each Play and Call External API ---

    // 4. If all plays are successfully registered, write to Firestore

    // Commit the batched write to Firestore after a successful API call (or before, depending on desired atomicity)
    await batch.commit();
    console.log('Transaction and plays saved successfully using batched write.');



    // 5. Generate a unique clientTicketNumber for the agency (Placeholder)
    const clientTicketNumber = `AG${data.agencyId || 'UNKNOWN'}-${Date.now()}-${ticketRef.id.substring(0, 5).toUpperCase()}`; // Simple placeholder, implement proper sequence logic

    // 6. Return the ticketId and clientTicketNumber
    return { success: true, ticketId: ticketRef.id, clientTicketNumber: clientTicketNumber };

  } catch (error) {
 console.error('Error processing transaction:', error);
 // Handle errors and throw HttpsError
 throw new functions.https.HttpsError('unknown', 'An error occurred while processing the transaction.', error);
  }
});

exports.registerNewAgencyRequest = functions.https.onCall(async (data, context) => {
  // Verify Super-Admin role
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const userId = context.auth.uid;
  const firestore = admin.firestore();

  try { // Fetching user document to verify role
    const userDoc = await firestore.collection('users').doc(userId).get();

    if (!userDoc.exists || userDoc.data().role !== 'super-admin') {
      throw new functions.https.HttpsError('permission-denied', 'Only Super-Admins can approve agencies.');
    }

    // Validate input
    const { agencyId } = data;
    if (!agencyId) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required field: agencyId');
    }

    // Update agency status to 'active'
    const agencyRef = firestore.collection('agencies').doc(agencyId);
    await agencyRef.update({ status: 'active' });

    return { success: true, message: `Agency ${agencyId} approved successfully.` };

  } catch (error) {
    console.error('Error approving agency:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsErrors
    }

    // Handle specific Firestore errors (e.g., document not found)
    if (error.code === 'not-found') {
       throw new functions.https.HttpsError('not-found', `Agency with ID ${data.agencyId} not found.`);
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while approving the agency.', error);
  }
});

exports.approveAgency = functions.https.onCall(async (data, context) => {
  // Verify Super-Admin role using context.auth.token.role
  if (!context.auth || !context.auth.token) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  if (context.auth.token.role !== 'super-admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super-Admins can approve agencies.');
  }

  // Validate input
  const { agencyId } = data;
  if (!agencyId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required field: agencyId');
  }

  const firestore = admin.firestore();

  try {
    // Update agency status to 'active'
    const agencyRef = firestore.collection('agencies').doc(agencyId);
    await agencyRef.update({ status: 'active' });

    return { success: true, message: `Agency ${agencyId} approved successfully.` };

  } catch (error) {
    console.error('Error approving agency:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsErrors
    }

    // Handle specific Firestore errors (e.g., document not found)
    if (error.code === 'not-found') {
       throw new functions.https.HttpsError('not-found', `Agency with ID ${data.agencyId} not found.`);
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while approving the agency.', error);
  }
});


exports.manageBettingHouse = functions.https.onCall(async (data, context) => {
  // 1. Verify Super-Admin role
  if (!context.auth || !context.auth.token || context.auth.token.role !== 'super-admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only Super-Admins can manage betting houses.');
  }

  // 2. Validate Input
  const { action, payload } = data;
  if (!action || !payload) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: action and payload.');
  }

  const firestore = admin.firestore();

  try {
    let message = 'Operation successful.';

    // 3. Handle Actions (CRUD)
    switch (action) {
      case 'create':
        // Validate payload for create (ensure required fields are present)
        if (!payload.name || !payload.apiConfig) {
 throw new functions.https.HttpsError('invalid-argument', 'Missing required fields for creating a betting house (name, apiConfig).');
        }
        // Note: apiKeySecretName in apiConfig should be stored,
        // the actual secret value must be uploaded to Secret Manager manually or via script.
 await firestore.collection('bettingHouses').add({ ...payload, status: 'active' }); // Default status to active
        message = `Betting house "${payload.name}" created successfully.`;
        break;

      case 'update':
        // Validate payload for update (ensure id and fields to update are present)
        if (!payload.id || Object.keys(payload).length <= 1) { // Check for id and at least one other field
 throw new functions.https.HttpsError('invalid-argument', 'Missing required fields or no data to update for betting house.');
        }
 const bettingHouseId = payload.id;
 const updateData = { ...payload };
 delete updateData.id; // Don't include id in the update data in the update operation
 await firestore.collection('bettingHouses').doc(bettingHouseId).update(updateData);
        message = `Betting house with ID "${bettingHouseId}" updated successfully.`;
        break;

      case 'toggleStatus':
        // Validate payload for toggleStatus (ensure id is present)
        if (!payload.id) {
 throw new functions.https.HttpsError('invalid-argument', 'Missing required field: id for toggling betting house status.');
        }
 const houseDocRef = firestore.collection('bettingHouses').doc(payload.id);
 const houseDoc = await houseDocRef.get();
 if (!houseDoc.exists) {
 throw new functions.https.HttpsError('not-found', `Betting house with ID "${payload.id}" not found.`);
         }
 const currentStatus = houseDoc.data().status || 'inactive'; // Default to inactive if status is missing
 const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
 await houseDocRef.update({ status: newStatus });
 message = `Betting house with ID "${payload.id}" status toggled to "${newStatus}".`;
        break;

exports.payOutTicket = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }
});

      default:
        throw new functions.https.HttpsError('invalid-argument', `Invalid action: ${action}`);
    }

    // 5. Return a success message
    return { success: true, message: message };

  } catch (error) {


exports.checkTicketForWins = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  // 1. Validate Input
  const { clientTicketNumber, agencyId } = data;
  if (!clientTicketNumber || !agencyId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields: clientTicketNumber and agencyId.');
  }

  const firestore = admin.firestore();

  try {
    // 2. Look up the ticket in Firestore
    const ticketsRef = firestore.collection('tickets');
    const querySnapshot = await ticketsRef
      .where('clientTicketNumber', '==', clientTicketNumber)
      .where('agencyId', '==', agencyId)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      throw new functions.https.HttpsError('not-found', `Ticket with client number ${clientTicketNumber} not found for agency ${agencyId}.`);
    }

    const ticketDoc = querySnapshot.docs[0];
    const ticketData = ticketDoc.data();
    const ticketRef = ticketDoc.ref;

    // 3. Fetch Plays
    const playsSnapshot = await ticketRef.collection('plays').get();
    const playsData = playsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const winningPlays = [];
    let totalPrize = 0;
    const drawResultsMap = new Map(); // Map to store draw results for efficient lookup
    const batch = firestore.batch(); // Use a batch for updating play documents

    // 4. Iterate and Check Each Play
    for (const play of playsData) {
      // Get the last draw result
      // This assumes the drawId is stored in the play document or can be determined from drawTime and bettingHouseId
      const drawRef = firestore.collection('bettingHouses').doc(play.bettingHouseId).collection('draws').doc(play.drawTime); // Assuming drawTime is the doc ID

      // Construct a unique key for the draw result in the map
      const drawKey = `${play.bettingHouseId}-${play.drawTime}`;
      let lastResult = null;

      // Check if the draw result is already in the map
      if (drawResultsMap.has(drawKey)) {
        lastResult = drawResultsMap.get(drawKey);
      } else {
        // If not in the map, fetch the draw document
        const drawDoc = await drawRef.get();

        if (drawDoc.exists && drawDoc.data().lastResult) {
          lastResult = drawDoc.data().lastResult;
          // Store the result in the map for future plays with the same draw
          drawResultsMap.set(drawKey, lastResult);
        } else {
          console.warn(`Draw result not found for play ${play.id} (Betting House: ${play.bettingHouseId}, Draw Time: ${play.drawTime}). Cannot check for wins.`);
          // Depending on your policy, you might throw an error or just skip this play
          continue; // Skip to the next play if the draw result is not found
        }
      }

      // Proceed with win check only if lastResult was found
      if (lastResult !== null) {

        // Compare playExpanded with the result to determine if it is a winner (Placeholder)
        let isWinner = false;
        let prizeAmount = 0;

        // --- Begin: Prize Calculation Logic (Placeholder) ---
        // Implement your game-specific logic here to compare play.playExpanded with lastResult
        // and calculate prizeAmount based on payout rules (fetch payout rules as needed).
        // Example: Simple exact match check for a single number game
        // if (play.playType === 'single_number' && play.playInput === lastResult) {
        //   isWinner = true;
        //   prizeAmount = play.totalPlayAmount * 30; // Example payout rule
        // }
        // --- End: Prize Calculation Logic ---

        if (isWinner) {
          winningPlays.push({ ...play, prizeAmount });
          totalPrize += prizeAmount;

          // Update isWinner and prizeAmount in the play document
          const playRef = ticketRef.collection('plays').doc(play.id);
          batch.update(playRef, { isWinner: true, prizeAmount: prizeAmount });
        } else {
             // Optionally update isWinner to false if not a winner, or skip the update if you default it to false
             const playRef = ticketRef.collection('plays').doc(play.id);
             batch.update(playRef, { isWinner: false, prizeAmount: 0 });
        }
    }

    // Commit the batch updates to the play documents
    if (!batch._ops || batch._ops.length > 0) { // Check if there are operations in the batch
        await batch.commit();
        console.log(`Updated ${winningPlays.length} play documents for ticket ${ticketId}.`);
    } else {
        console.log(`No play documents needed updates for ticket ${ticketId}.`);
    }


    // 5. Calculate the total prize for the ticket (already done in the loop)

    // 6. Return an object with the ticket details, the winning plays, and the total prize
    return {
      ticket: ticketData,
      winningPlays: winningPlays,
      totalPrize: totalPrize,
    };

  } catch (error) {
    console.error('Error checking ticket for wins:', error);

    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsErrors
    }

    throw new functions.https.HttpsError('internal', 'An error occurred while checking the ticket for wins.', error);
  }

    console.error('Error managing betting house:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error; // Re-throw HttpsErrors
    }
    throw new functions.https.HttpsError('internal', 'An error occurred while managing the betting house.', error);
  }
});


exports.fetchAndStoreDrawResults = functions.pubsub.topic('fetch-draw-results').onPublish(async (message, context) => {
  console.log('fetchAndStoreDrawResults function triggered by Pub/Sub.');

  const firestore = admin.firestore();

  try {
    // Query the 'bettingHouses' collection for active betting houses
    const activeBettingHousesSnapshot = await firestore.collection('bettingHouses').where('status', '==', 'active').get();


    // Placeholder for iterating through active betting houses and processing draws
    console.log(`Found ${activeBettingHousesSnapshot.size} active betting houses.`);
    // Implement logic here to iterate through betting houses, fetch API config,
    // access Secret Manager, call external API, and update draw results in Firestore.

  } catch (error) {
    console.error('Error in fetchAndStoreDrawResults:', error);
    // Handle errors appropriately - this is a background function, not callable.
  }
});
