class Witness{
    constructor(transactionHash, signature){
        this.transactionHash = transactionHash;
        this.signature = signature;
    }
}
module.exports = { Witness };