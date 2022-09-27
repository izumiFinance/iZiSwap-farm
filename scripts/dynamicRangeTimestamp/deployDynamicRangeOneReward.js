const hardhat = require("hardhat");
const contracts = require("../deployed.js");
const BigNumber = require("bignumber.js");

// example
// HARDHAT_NETWORK='izumiTest' \
//     node deployMiningDynamicRangeOneReward.js \
//     'DDAO' 'WETH9' 3000 \
//     'iZi' 0.462962962 iZi_PROVIDER \
//      startTime endTime \
//      0.25 4 \
//      1 \
//      40 \
//      CHARGE_RECEIVER 
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

    startTime: v[8],
    endTime: v[9],

    pcLeftScale: v[10],
    pcRightScale: v[11],

    boost: v[12],
    feeChargePercent: v[13],
    chargeReceiver: getProviderAddress(v[14]),
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
  var numNoDecimal = num * (10 ** decimal);
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

  if (para.token0Address.toUpperCase() > para.token1Address.toUpperCase()) {
    var tmp = para.token0Address;
    para.token0Address = para.token1Address;
    para.token1Address = tmp;

    tmp = para.token0Symbol;
    para.token0Symbol = para.token1Symbol;
    para.token1Symbol = tmp;
  }

  const Mining = await hardhat.ethers.getContractFactory("DynamicRangeTimestamp");

  para.rewardPerSecond0 = await getNumNoDecimal(para.rewardTokenAddress0, para.rewardPerSecond0);
  console.log("Deploy DynamicRangeTimestamp Contract: %s/%s", para.token0Symbol,  para.token1Symbol);
  console.log("Paramters: ");
  for ( var i in para) { console.log("    " + i + ": " + para[i]); }

  console.log('=====================');


  console.log("Deploying .....");

  var iziAddr = '0x0000000000000000000000000000000000000000';

  if (para.boost.toString() != '0') {
    iziAddr = contracts[net]['iZi'];
  }

  console.log('iziAddr: ', iziAddr);

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
    }],
    iziAddr,
    para.startTime, para.endTime,
    para.feeChargePercent,
    para.chargeReceiver,
    tickRangeLeft,
    tickRangeRight
  ];

  console.log('args: ', args);

  const mining = await Mining.deploy(...args);
  await mining.deployed();
  
  //await approve(await attachToken(para.rewardTokenAddress0), deployer, mining.address, "1000000000000000000000000000000");
  //await approve(await attachToken(para.rewardTokenAddress1), deployer, mining.address, "1000000000000000000000000000000");

  console.log("DynamicRangeTimestamp Contract Address: " , mining.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
