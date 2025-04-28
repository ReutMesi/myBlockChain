// bloom.js

const SHA256 = require('crypto-js/sha256');

class BloomFilter {
    constructor(size = 1000, numHashes = 3) {
        this.size = size; // Size of the bit array
        this.numHashes = numHashes; // Number of hash functions
        this.bitArray = new Array(size).fill(false);
    }

    _hash(value, seed) {
        return parseInt(SHA256(seed + value).toString().substring(0, 8), 16) % this.size;
    }

    add(item) {
        for (let i = 0; i < this.numHashes; i++) {
            const index = this._hash(item, i);
            this.bitArray[index] = true;
        }
    }

    contains(item) {
        for (let i = 0; i < this.numHashes; i++) {
            const index = this._hash(item, i);
            if (!this.bitArray[index]) {
                return false;
            }
        }
        return true;
    }
}

// Factory function to create Bloom filter for transactions
function createTransactionBloomFilter(transactions) {
    const bloomFilter = new BloomFilter(500, 3);
    for (const tx of transactions) {
        bloomFilter.add(tx.calculateHash());
        bloomFilter.add(tx.fromAddress);
        bloomFilter.add(tx.toAddress);
    }
    return bloomFilter;
}

// Factory function to create Bloom filter for addresses
function createAddressBloomFilter(addresses) {
    const bloomFilter = new BloomFilter(500, 3);
    for (const address of addresses) {
        bloomFilter.add(address);
    }
    return bloomFilter;
}

module.exports = {
    BloomFilter,
    createTransactionBloomFilter,
    createAddressBloomFilter
};
