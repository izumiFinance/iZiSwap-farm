const hardhat = require("hardhat");
const contracts = require("../deployed.js");
const BigNumber = require("bignumber.js");

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
    token0Symbol: v[2],
    token0Address: contracts[net][v[2]],
    token1Symbol: v[3],
    token1Address: contracts[net][v[3]],
    fee: v[4],

    rewardTokenSymbol0: v[5],
    rewardTokenAddress0: contracts[net][v[5]],
    rewardPerSecond0: v[6],
    provider0Symbol: v[7],
    provider0: getProviderAddress(v[7]),

    rewardTokenSymbol1: v[8],
    rewardTokenAddress1: contracts[net][v[8]],
    rewardPerSecond1: v[9],
    provider1Symbol: v[10],
    provider1: getProviderAddress(v[10]),

    startTime: v[11],
    endTime: v[12],

    pcLeftScale: v[13],
    pcRightScale: v[14],

    boost: v[15],
    feeChargePercent: v[16],
    chargeReceiver: getProviderAddress(v[17]),
    useOriginLiquidity: v[18],
}


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
  var numNoDecimal = new BigNumber(num).times(10 ** decimal);
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
    
  const [deployer] = await hardhat.ethers.getSigners();

  console.log('origin para: ', para)

  if (para.token0Address.toUpperCase() > para.token1Address.toUpperCase()) {
    var tmp = para.token0Address;
    para.token0Address = para.token1Address;
    para.token1Address = tmp;

    tmp = para.token0Symbol;
    para.token0Symbol = para.token1Symbol;
    para.token1Symbol = tmp;
    const leftScale = 1.0 / para.pcRightScale
    const rightScale = 1.0 / para.pcLeftScale
    para.pcLeftScale = leftScale
    para.pcRightScale = rightScale
  }

  const Mining = await hardhat.ethers.getContractFactory("DynamicRangeNFTSwitchTimestamp");

  para.rewardPerSecond0 = await getNumNoDecimal(para.rewardTokenAddress0, para.rewardPerSecond0);
  para.rewardPerSecond1 = await getNumNoDecimal(para.rewardTokenAddress1, para.rewardPerSecond1);
  console.log("Deploy DynamicRange Contract: %s/%s", para.token0Symbol,  para.token1Symbol);
  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }

  console.log('=====================');


  console.log("Deploying .....");

  var iziAddr = '0x0000000000000000000000000000000000000000';

  if (para.boost.toString() != '0') {
    iziAddr = contracts[net][para.boost];
  }

  console.log('boostAddr: ', iziAddr);

  tickRangeLeft = Math.round(Math.log(1.0 / Number(para.pcLeftScale)) / Math.log(1.0001));
  tickRangeRight = Math.round(Math.log(para.pcRightScale) / Math.log(1.0001));

  console.log('tick range left: ', tickRangeLeft);
  console.log('tick range right: ', tickRangeRight);

  const args = [
    {
      iZiSwapLiquidityManager: contracts[net].liquidityManager,
      tokenX: para.token0Address,
      tokenY: para.token1Address,
      fee: para.fee
    },
    [{
      rewardToken: para.rewardTokenAddress0,
      provider: para.provider0,
      accRewardPerShare: 0,
      rewardPerSecond: para.rewardPerSecond0,
    },
    {
      rewardToken: para.rewardTokenAddress1,
      provider: para.provider1,
      accRewardPerShare: 0,
      rewardPerSecond: para.rewardPerSecond1,
    }],
    iziAddr,
    para.startTime, para.endTime,
    para.feeChargePercent,
    para.chargeReceiver,
    tickRangeLeft,
    tickRangeRight,
    para.useOriginLiquidity === 'true'
  ];

  console.log('args: ', args);

  const mining = await Mining.deploy(...args);
  await mining.deployed();
  
  // await approve(await attachToken(para.rewardTokenAddress0), deployer, mining.address, "1000000000000000000000000000000");
  // await approve(await attachToken(para.rewardTokenAddress1), deployer, mining.address, "1000000000000000000000000000000");

  console.log("DynamicRangeTimestamp Contract Address: " , mining.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
