const hardhat = require("hardhat");
const contracts = require("../deployed.js");
const BigNumber = require("bignumber.js");

// example
// HARDHAT_NETWORK='ethereum' \
//     node deployMiningOneSideBoostTwoReward.js \
//     'USDC' 'DEVT' 3000 \
//     'iZi' 3.24074 0xaB11f1e579B177E80E7C20BE4cD8f4EcDF842A31 \
//     1 \
//     14163662 14712919 \
//     1 \
//     40 \ 
//     CHARGE_RECEIVER \
//     23027
const v = process.argv
const net = process.env.HARDHAT_NETWORK

function getProviderAddress(providerSymbolOrAddress) {
  if (providerSymbolOrAddress.slice(0, 2) === '0x') {
    console.log(providerSymbolOrAddress);
    return providerSymbolOrAddress;
  }
  return contracts[net][providerSymbolOrAddress];
}

var para = {
    tokenUniSymbol: v[2],
    tokenUniAddress: contracts[net][v[2]],
    tokenLockSymbol: v[3],
    tokenLockAddress: contracts[net][v[3]],
    fee: v[4],

    rewardTokenSymbol0: v[5],
    rewardTokenAddress0: contracts[net][v[5]],
    rewardPerBlock0: v[6],
    provider0Symbol: v[7],
    provider0: getProviderAddress(v[7]),

    lockBoostMultiplier: v[8],

    startBlock: v[9],
    endBlock: v[10],

    boost: v[11],
    feeChargePercent: v[12],
    chargeReceiver: getProviderAddress(v[13]),
    tickRangeLong: Number(v[14])
}
console.log('para: ', para);


async function attachToken(address) {
  var tokenFactory = await hardhat.ethers.getContractFactory("TestToken");
  var token = tokenFactory.attach(address);
  return token;
}

async function getDecimal(token) {
  var decimal = await token.decimals();
  return decimal;
}

async function getNumNoDecimal(tokenAddr, num) {
  var token = await attachToken(tokenAddr);
  var decimal = await getDecimal(token);
  var numNoDecimal = BigNumber(num).times(10 ** decimal);
  return numNoDecimal.toFixed(0);
}

async function priceNoDecimal(tokenAddr0, tokenAddr1, priceDecimal0By1) {
  var token0 = await attachToken(tokenAddr0);
  var token1 = await attachToken(tokenAddr1);

  var decimal0 = await getDecimal(token0);
  var decimal1 = await getDecimal(token1);

  var priceNoDecimal0By1 = priceDecimal0By1 * (10 ** decimal1) / (10 ** decimal0);
  return priceNoDecimal0By1;
}

async function approve(token, account, destAddr, amount) {
  await token.connect(account).approve(destAddr, amount);
}

async function main() {

  console.log('--------------------------------')
    
  const [deployer] = await hardhat.ethers.getSigners();

  console.log('deployer: ', deployer);

  const Mining = await hardhat.ethers.getContractFactory("OneSide");

  para.rewardPerBlock0 = await getNumNoDecimal(para.rewardTokenAddress0, para.rewardPerBlock0);
  //para.rewardPerBlock1 = await getNumNoDecimal(para.rewardTokenAddress1, para.rewardPerBlock1);

  console.log("Deploy MiningOneSideBoost Contract: %s/%s", para.tokenUniSymbol,  para.tokenLockSymbol);
  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }

  console.log("Deploying .....");

  var iziAddr = '0x0000000000000000000000000000000000000000';

  if (para.boost.toString() != '0') {
    iziAddr = contracts[net]['iZi'];
  }

  console.log('iziAddr: ', iziAddr);

  const args = [
    {
      iZiSwapLiquidityManager: contracts[net].liquidityManager,
      oneSideTokenAddr: para.tokenUniAddress,
      lockTokenAddr: para.tokenLockAddress,
      fee: para.fee
    },
    [{
      rewardToken: para.rewardTokenAddress0,
      provider: para.provider0,
      accRewardPerShare: 0,
      rewardPerBlock: para.rewardPerBlock0,
    }],
    para.lockBoostMultiplier,
    iziAddr,
    para.startBlock, para.endBlock,
    para.tickRangeLong,
    para.feeChargePercent,
    para.chargeReceiver,
  ];
  console.log('args: ', args);

  const mining = await Mining.deploy(
    ...args
  );
  await mining.deployed();

  // console.log(mining.deployTransaction);
  
  //await approve(await attachToken(para.rewardTokenAddress0), deployer, mining.address, "1000000000000000000000000000000");
  //await approve(await attachToken(para.rewardTokenAddress1), deployer, mining.address, "1000000000000000000000000000000");

  console.log("MiningOneSideBoost Contract Address: " , mining.address);

  console.log("iziAddr after deploy: ", await mining.iziToken())

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
