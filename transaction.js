const SHA256 = require('crypto-js/sha256');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Transaction {
    constructor(fromAddress, toAddress, amount, fee = 3, baseFee = 2) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.fee = fee; // reward to miner
        this.baseFee = baseFee; // burned fee
        this.timestamp = Date.now();
        this.hash = this.calculateHash();
    }

    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp + this.fee + this.baseFee).toString();
    }
}

module.exports = { Transaction };