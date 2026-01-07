
// This script sets the "admin" custom claim for a specific user email.
// Usage: node scripts/set_admin_claim.js <email>

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Path to your Service Account Key
// You must download this from Firebase Console -> Project Settings -> Service Accounts
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('Error: service-account-key.json not found!');
    console.error('Please download it from Firebase Console and place it in the project root.');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const email = process.argv[2];

if (!email) {
    console.error('Please provide an email address.');
    console.error('Usage: node scripts/set_admin_claim.js <email>');
    process.exit(1);
}

const setAdminClaim = async (email) => {
    try {
        const user = await admin.auth().getUserByEmail(email);

        await admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        });

        console.log(`Success! "admin" claim has been set for user: ${email} (${user.uid})`);
        console.log('The user may need to sign out and sign in again for changes to take effect.');

    } catch (error) {
        console.error('Error setting admin claim:', error);
        process.exit(1);
    }
};

setAdminClaim(email);
