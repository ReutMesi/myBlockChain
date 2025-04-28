const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { Transaction } = require('./transaction');
const {Witness} = require('./witness');

class Wallet{
    constructor(name, privateKey){
        this.name = name;
        this.key = ec.keyFromPrivate(privateKey);
        this.address = this.key.getPublic('hex');
        this.transactionsHistory = [];
    }

    createTransaction(toAddress, amount) {
        const minerReward = 3;  
        const burnedFee = 2;    
        const totalFee = minerReward + burnedFee;

        const totalAmount = amount + totalFee; 

        // Check if the wallet has enough balance to send the amount + fee
        if (totalAmount > this.balance) {
            console.log(`❌ Not enough balance to send ${amount} with fee of ${totalFee}`);
            return null;
        }
        const tx = new Transaction(this.address, toAddress, amount)
        this.transactionsHistory.push(tx);
        //console.log(`✅ Created transaction:`, tx);
        return tx;
    }

    signTransaction(tx) {
        const signature = ec.sign(tx.hash, this.key, 'hex');  
        const witness = new Witness(tx.hash, signature.toDER('hex'));  
        console.log('Signed transaction:', signature.toDER('hex'));
        return witness;  
    }

}

class FullWallet extends Wallet{
    constructor(name, privateKey, blockchain){
        super(name, privateKey)
        this.blockchain = blockchain;
    }

    validateAndUpdateBalance() {
        let totalBalance = 300;

        this.blockchain.chain.forEach(block => {
            block.transactions.forEach(tx => {
                if (tx.fromAddress === this.address) {
                    totalBalance -= tx.amount; 
                }
                if (tx.toAddress === this.address) {
                    totalBalance += tx.amount; 
                }
            });
        });

        this.balance = totalBalance; 
        console.log(`✅ Wallet balance updated: ${this.balance}`);
    }
}

module.exports = { FullWallet, Wallet };
