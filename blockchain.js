const SHA256 = require('crypto-js/sha256');
const MerkleTree = require('merkletreejs').default;
const BloomFilter = require('bloom-filter');
const { Transaction } = require('./transaction');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const STARTING_BALANCE = 300;

class Block {
    constructor(previousHash = '', transactions = [], witnesses = [],timestamp = Date.now()) {
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.witnesses = witnesses;
        this.nonce = 0;

        this.merkleTree = this.createMerkleTree(transactions);
        this.merkleRoot = this.merkleTree.getRoot().toString('hex');
        
        this.bloomFilter = BloomFilter.create(32 * 1024, 4); // 32KB size, 4 hash functions
        this.addTransactionsToBloomFilter(transactions);

        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + this.merkleRoot + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined:", this.hash);
    }

    createMerkleTree(transactions) {
        const txHashes = transactions.map(tx => SHA256(tx.hash).toString());  // Assuming each transaction has a 'hash' field
        return new MerkleTree(txHashes, SHA256);
    }

    isValidTransaction(tx, witness) {
        const publicKey = ec.keyFromPublic(tx.fromAddress, 'hex');
        return publicKey.verify(tx.hash, witness.signature);
    }

    addTransactionsToBloomFilter(transactions) {
        transactions.forEach(tx => {
            if (!tx.hash) {
                console.log(`Transaction with missing hash: ${JSON.stringify(tx)}`);
                tx.hash = tx.calculateHash();  
            }
            this.bloomFilter.insert(tx.hash);  
        });
    }
    

    hasValidTransactions() {
        // Step 1: Validate the Merkle root
        const recalculatedMerkleRoot = this.merkleTree.getRoot().toString('hex');
        if (this.merkleRoot !== recalculatedMerkleRoot) {
            console.log("Invalid Merkle root!");
            return false;
        }

        // Step 2: Validate each transaction's signature
        for (let tx of this.transactions) {
            if (tx.fromAddress === null) {
                continue;
            }
            const witness = this.findWitnessByTransactionHash(tx.hash);

            if (!witness || !this.isValidTransaction(tx, witness)) {
                console.log(`Invalid signature for transaction: ${tx.hash}`);
                return false;
            }
        }

        //console.log("All transactions are valid.");
        return true;
    } 

    findWitnessByTransactionHash(transactionHash) {
        return this.witnesses.find(witness => witness.transactionHash === transactionHash);
    } 
    
    isTransactionInBlock(tx) {
        return this.bloomFilter.contains(tx.hash);
        //return this.bloomFilter.test(tx.hash);  // Use Bloom filter to check if the transaction hash is in the block
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.witnesses = [];
        this.miningReward = 50;
        this.burnedAmount = 0;
        this.minedAmount = 0;
    }

    createGenesisBlock() {
        return new Block("0", [], [], "01/01/2009");
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress) {
        while (this.pendingTransactions.length >= 3) {
            const transactionsToMine = this.pendingTransactions.splice(0, 3); // Get 3 transactions
            
            const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0, 0);
            transactionsToMine.push(rewardTx); 
    
            const block = new Block(this.getLatestBlock().hash, transactionsToMine, this.witnesses, Date.now());
            block.mineBlock(this.difficulty); 
    
            this.chain.push(block); 
            this.minedAmount += this.miningReward; 
    
            transactionsToMine.forEach(tx => {
                this.burnedAmount += tx.baseFee; 
            });
    
            console.log(`✅ Block successfully mined with ${transactionsToMine.length} transactions.`);
        }
    
        // Check if there are remaining transactions (less than 3) and handle them
        if (this.pendingTransactions.length > 0) {
            console.log(`❗ Pending transactions left: ${this.pendingTransactions.length}, but fewer than 3 transactions left to mine.`);
            const remainingTxs = this.pendingTransactions.splice(0, this.pendingTransactions.length);
            const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0, 0);
            remainingTxs.push(rewardTx); // Add reward to remaining transactions
    
            // Create the final block for remaining transactions
            const block = new Block(this.getLatestBlock().hash, remainingTxs, this.witnesses, Date.now());
            block.mineBlock(this.difficulty);
            
            this.chain.push(block);
            this.minedAmount += this.miningReward;
            
            remainingTxs.forEach(tx => {
                this.burnedAmount += tx.baseFee; // Update the burned amount for each transaction
            });
    
            console.log(`✅ Final block mined with remaining transactions.`);
        }
    }
    
    // minePendingTransactions(miningRewardAddress) {
    //     if (this.pendingTransactions.length < 3) {
    //         throw new Error('Not enough transactions to mine a block (need at least 3).');
    //     }
    
    //     const transactionsToMine = this.pendingTransactions.splice(0, 3);
    
    //     const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward, 0, 0);
    //     transactionsToMine.push(rewardTx); // now exactly 4 transactions
    
        
    //     const block = new Block(this.getLatestBlock().hash, transactionsToMine, this.witnesses, Date.now());
    //     block.mineBlock(this.difficulty);
    
    //     this.chain.push(block);
    //     this.minedAmount += this.miningReward;
    
    //     transactionsToMine.forEach(tx => {
    //         this.burnedAmount += tx.baseFee;
    //     });
    // }
    

    addTransaction(transaction, witness) {
        if (!transaction.fromAddress || !transaction.toAddress || transaction.amount <= 0) {
            console.log("Invalid transaction!");
            return;
        }
        this.pendingTransactions.push(transaction);
        this.witnesses.push(witness);
    }

    getBalanceByAddress(address) {
        let balance = 300;  // Starting balance
        this.chain.forEach(block => {
            block.transactions.forEach(tx => {
                if (tx.fromAddress === address) {
                    balance -= tx.amount;  
                    balance -= (tx.fee + tx.baseFee);  
                }
                if (tx.toAddress === address) {
                    balance += tx.amount;  
                }
            });
        });

        return balance;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];
    
            if (!currentBlock.hasValidTransactions()) {
                console.log(`Invalid transactions at block ${i}`);
                return false;
            }
            if (currentBlock.hash !== currentBlock.calculateHash()) {
                console.log(`Invalid hash at block ${i}`);
                console.log(`Stored: ${currentBlock.hash}`);
                console.log(`Calculated: ${currentBlock.calculateHash()}`);
                return false;
            }
            if (currentBlock.previousHash !== previousBlock.hash) {
                console.log(`Invalid previous hash link at block ${i}`);
                console.log(`Current previousHash: ${currentBlock.previousHash}`);
                console.log(`Actual previous block's hash: ${previousBlock.hash}`);
                return false;
            }
        }
        console.log("Blockchain is valid.");
        return true;
    }
    
    getTotalBurned() {
        return this.burnedAmount;
    }

    getTotalMined() {
        return this.minedAmount;
    }
}

module.exports = { Blockchain };
