const { Blockchain } = require('./blockchain');
const { FullWallet, Wallet } = require('./wallets');
const EC = require('elliptic').ec;
const fs = require('fs');
const ec = new EC('secp256k1');

// === Private & Public Keys ===
const reutPrivateKey = '1136f7571e16bcaafb783b00f1e08e8dc94a26d2a0b14828e294282fe39eb759';
const dorPrivateKey = '67d030748b9ab833b3e7280ef8804865867c4efeee2684d52566ca04331501b3';
const totoPrivateKey = 'e787df807c65ed9c0c9716143bfbcd33d4a39766fe2d3ad4ea229e8ed657533e';

const reutPublicKey = '046e15ce754ce86d5493d9fed72f72863262ee5e00d561264ded82a10f5867b7fe68b689ca236f14f259c15a03079b3444e3a52b94c144895e93261afe60a7dc29';
const dorPublicKey = '04ef3d3d37eff7e165cfe8c885b74bf0e7b5e39f46eafb07e5ef67c0b9e0206dc98a6570d7237d098d337628e11fa13b273e509caeb7bc019b145bcfad73a33ceb'; 
const totoPublicKey = '04956a00ed29083284deccf3658bde1200ec3247a83621ff3295ac5f5c52fece325d0a7ea5ee487dd0f17b81a5374cb4f60b3389d8a221d84ee9a90024c256fb23'; 

console.log("🔑 Reut Public Key:", reutPublicKey);
console.log("🔑 Dor Public Key:", dorPublicKey);
console.log("🔑 Toto Public Key:", totoPublicKey);

// === Blockchain and Wallets ===
const blockchain = new Blockchain();

// Create a Full Wallet (Full Node Miner)
const fullWallet = new FullWallet("Reut (Full Wallet)", reutPrivateKey, blockchain);

// Create Light Wallets for Dor and Toto
const dorLightWallet = new Wallet("Dor (Light Wallet)", dorPrivateKey);
const totoLightWallet = new Wallet("Toto (Light Wallet)", totoPrivateKey);

// === Read mempool ===
let mempool;
try {
    mempool = JSON.parse(fs.readFileSync('./mempool.json'));
    console.log(`📦 Loaded ${mempool.length} transactions from mempool.`);
} catch (error) {
    console.error("❌ Failed to read mempool.json", error);
    process.exit(1);
}

// === Process Mempool Transactions ===
mempool.forEach(txData => {
    //console.log(`📝 Processing transaction from ${txData.fromAddress} to ${txData.toAddress} with amount ${txData.amount}`);

    // Use the createTransaction method to create the transaction
    let tx;
    let witness;

    if (txData.fromAddress === reutPublicKey) {
        // Reut's wallet: create the transaction
        tx = fullWallet.createTransaction(txData.toAddress, txData.amount);
        witness = fullWallet.signTransaction(tx);
    } else if (txData.fromAddress === dorPublicKey) {
        // Dor's wallet: create the transaction
        tx = dorLightWallet.createTransaction(txData.toAddress, txData.amount);
        witness = dorLightWallet.signTransaction(tx);
    } else if (txData.fromAddress === totoPublicKey) {
        // Toto's wallet: create the transaction
        tx = totoLightWallet.createTransaction(txData.toAddress, txData.amount);
        witness = totoLightWallet.signTransaction(tx);
    }

    // Log transaction creation and signing
    if (tx && witness) {
        console.log(`✅ Transaction created and signed, adding to blockchain.`);
        // Add the signed transaction to the blockchain's pending transactions
        blockchain.addTransaction(tx, witness);
    }
});

// === Mine Pending Transactions ===
console.log("⛏️ Mining pending transactions...");
try {
    blockchain.minePendingTransactions(reutPublicKey); // Reut is the miner
    console.log(`\n✅ Block Chain successfully mined by Reut!`);
} catch (error) {
    console.error("❌ Mining failed:", error);
}

// === Example: Checking if a specific transaction is in the latest block ===
const latestBlock = blockchain.getLatestBlock();
const sampleTransaction = dorLightWallet.transactionsHistory[0]; // Just taking the first pending transaction as a sample

// Check if the sample transaction is already included in the latest block
const isInBlock = latestBlock.isTransactionInBlock(sampleTransaction);
console.log(`\nIs the sample transaction in the latest block? ${isInBlock ? "Yes" : "No"}`);

// === Final Balances ===
console.log(`\n💰 Reut's final balance: ${blockchain.getBalanceByAddress(reutPublicKey)}`);
console.log(`💰 Dor's final balance: ${blockchain.getBalanceByAddress(dorPublicKey)}`);
console.log(`💰 Toto's final balance: ${blockchain.getBalanceByAddress(totoPublicKey)}`);
console.log(`\n🔗 Blockchain is valid: ${blockchain.isChainValid()}`);

// === Summary of Burned and Mined Amount ===
console.log(`\n💵 Total Burned Amount: ${blockchain.getTotalBurned()}`);
console.log(`💵 Total Mined Reward: ${blockchain.getTotalMined()}`);

