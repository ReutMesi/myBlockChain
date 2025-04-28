const EC = require('elliptic').ec
const ec = new EC('secp256k1')

// Reut
const reutKey = ec.genKeyPair();
const reutPublicKey = reutKey.getPublic('hex');
const reutPrivateKey = reutKey.getPrivate('hex');

// Dor
const dorKey = ec.genKeyPair();
const dorPublicKey = dorKey.getPublic('hex');
const dorPrivateKey = dorKey.getPrivate('hex');

// Toto
const totoKey = ec.genKeyPair();
const totoPublicKey = totoKey.getPublic('hex');
const totoPrivateKey = totoKey.getPrivate('hex');

// Print keys
console.log("🔑 Reut Public Key:", reutPublicKey);
console.log("🛡️ Reut Private Key:", reutPrivateKey);
console.log();
console.log("🔑 Dor Public Key:", dorPublicKey);
console.log("🛡️ Dor Private Key:", dorPrivateKey);
console.log();
console.log("🔑 Toto Public Key:", totoPublicKey);
console.log("🛡️ Toto Private Key:", totoPrivateKey);
console.log();