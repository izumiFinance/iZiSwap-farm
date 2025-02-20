
const {ethers} = require("hardhat");

const BigNumber = require('bignumber.js');

const Web3 = require("web3");
const secret = require('../.secret.js');
const pk = secret.pk;

const config = require("../../hardhat.config.js");
const contracts = require('../deployed.js');

const poolABI = [
    {
      "inputs": [
        {
          "internalType": "uint16",
          "name": "newNextQueueLen",
          "type": "uint16"
        }
      ],
      "name": "expandObservationQueue",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
]

const liquidityManagerABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "tokenX",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "tokenY",
        "type": "address"
      },
      {
        "internalType": "uint24",
        "name": "fee",
        "type": "uint24"
      }
    ],
    "name": "pool",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
]

const v = process.argv
const net = process.env.HARDHAT_NETWORK

const rpc = config.networks[net].url
const web3 = new Web3(new Web3.providers.HttpProvider(rpc));

const para = {
    token0Symbol: v[2],
    token0Address: contracts[net][v[2]],
    token1Symbol: v[3],
    token1Address: contracts[net][v[3]],
    fee: v[4],
    queueLen: v[5],
}

async function main() {

  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }
  console.log("=======================================")
  const [deployer] = await ethers.getSigners();

  const liquidityManagerAddress = contracts[net].liquidityManager
  const liquidityManager = new web3.eth.Contract(liquidityManagerABI, liquidityManagerAddress)
  const poolAddress = await liquidityManager.methods.pool(para.token0Address, para.token1Address, para.fee).call()
  console.log(' -- pool: ', poolAddress)
  const pool = new web3.eth.Contract(poolABI, poolAddress)
  // do expand operation

  const txData = await pool.methods.expandObservationQueue(para.queueLen).encodeABI()
  const gasLimit = await pool.methods.expandObservationQueue(para.queueLen).estimateGas({from: deployer.address});
  console.log('gas limit: ', gasLimit);
  const signedTx = await web3.eth.accounts.signTransaction(
      {
          to: poolAddress,
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
