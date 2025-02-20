
const abi = [
    {
        "inputs": [
          {
            "internalType": "uint256",
            "name": "_endTime",
            "type": "uint256"
          }
        ],
        "name": "modifyEndTime",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
      },
]


const {ethers} = require("hardhat");

const BigNumber = require('bignumber.js');

const Web3 = require("web3");
const secret = require('../../.secret.js');
const pk = secret.pk;

const config = require("../../hardhat.config.js");
const contracts = require('../deployed.js');

const v = process.argv
const net = process.env.HARDHAT_NETWORK

const rpc = config.networks[net].url
const web3 = new Web3(new Web3.providers.HttpProvider(rpc));

const para = {
    address: web3.utils.toChecksumAddress(v[2]),
    endTime: v[3]
}

async function main() {

  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }
  const [deployer] = await ethers.getSigners();

  const contract = new web3.eth.Contract(abi, para.address)
  // do expand operation

  const txData = await contract.methods.modifyEndTime(para.endTime).encodeABI()
  const gasLimit = await contract.methods.modifyEndTime(para.endTime).estimateGas({from: deployer.address});
  console.log('gas limit: ', gasLimit);
  const signedTx = await web3.eth.accounts.signTransaction(
      {
          to: para.address,
          data:txData,
          gas: BigNumber(gasLimit * 1.1).toFixed(0, 2),
      }, 
      pk
  );
  // nonce += 1;
  const tx = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
  console.log('tx: ', tx);
}

main().then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
})

module.exports = main;
