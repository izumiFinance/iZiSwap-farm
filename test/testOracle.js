
const { BigNumber } = require("bignumber.js");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getPoolParts, getIzumiswapFactory, attachiZiSwapPool, getNFTLiquidityManager, getSwap } = require("./library/funcs")

async function getToken() {

  // deploy token
  const tokenFactory = await ethers.getContractFactory("TestToken")
  tokenX = await tokenFactory.deploy('a', 'a', 18);
  await tokenX.deployed();
  tokenY = await tokenFactory.deploy('b', 'b', 18);
  await tokenY.deployed();

  txAddr = tokenX.address.toLowerCase();
  tyAddr = tokenY.address.toLowerCase();

  if (txAddr > tyAddr) {
    tmpAddr = tyAddr;
    tyAddr = txAddr;
    txAddr = tmpAddr;

    tmpToken = tokenY;
    tokenY = tokenX;
    tokenX = tmpToken;
  }
  return [tokenX, tokenY];
}

function getFix96(a) {
    var b = BigNumber(a).times(BigNumber(2).pow(96));
    return b.toFixed(0);
}

function fix962Float(a) {
    let aa = BigNumber(a);
    let div = BigNumber(2).pow(96);
    return Number(aa.div(div).toFixed(10));
}

/*

        // the current price
        uint160 sqrtPriceX96;
        // the current tick
        int24 tick;
        // the most-recently updated index of the observations array
        uint16 observationIndex;
        // the current maximum number of observations that are being stored
        uint16 observationCardinality;
        */

async function getState(pool) {

        // uint160 sqrtPrice_96,
        // int24 currentPoint,
        // uint16 observationCurrentIndex,
        // uint16 observationQueueLen,
        // uint16 observationNextQueueLen,
        // bool locked,
        // uint128 liquidity,
        // uint128 liquidityX
    const {sqrtPrice_96, currentPoint, observationCurrentIndex, observationQueueLen, observationNextQueueLen} = await pool.state()
    
    return {
        sqrtPrice_96: sqrtPrice_96.toString(),
        currentPoint,
        observationCurrentIndex,
        observationQueueLen,
        observationNextQueueLen
    }
}

async function getOracle(testOracle, poolAddr) {
    const {point, sqrtPriceX96, currentPoint, currSqrtPriceX96} = await testOracle.getAvgPointPriceWithin2Hour(poolAddr);
    return {
        point,
        sqrtPriceX96: sqrtPriceX96.toString(),
        currentPoint,
        currSqrtPriceX96: currSqrtPriceX96.toString()
    };
}

/*

        // the block timestamp of the observation
        uint32 blockTimestamp;
        // the tick accumulator, i.e. tick * time elapsed since the pool was first initialized
        int56 tickCumulative;
        // the seconds per liquidity, i.e. seconds elapsed / max(1, liquidity) since the pool was first initialized
        uint160 secondsPerLiquidityCumulativeX128;
        // whether or not the observation is initialized
        bool initialized;
        */
async function getObservation(pool, idx) {

    // uint32 timestamp,
    // int56 accPoint,
    // bool init
    const {timestamp, accPoint, init} = await pool.observations(idx);
    // console.log('{timestamp, accPoint, init}', {timestamp, accPoint.toSt, init})
    return {timestamp, accPoint: accPoint.toString(), init}
}

function getAvgTick(obs0, obs1) {
    var blockDelta = BigNumber(obs1.timestamp).minus(obs0.timestamp);
    var tickDelta = BigNumber(obs1.accPoint).minus(obs0.accPoint);
    console.log('avg tick: ', Number(tickDelta.div(blockDelta).toFixed(10)))
    const avg = tickDelta.div(blockDelta)
    if (avg.gt(0)) {
        return Number(avg.toFixed(0, 3))
    } else {
        return Number(avg.toFixed(0, 2))
    }
    // return Number(tickDelta.div(blockDelta).toFixed(0, 3));
}

function getAvgTick(obs0, obs1) {
    var blockDelta = BigNumber(obs1.timestamp).minus(obs0.timestamp);
    var tickDelta = BigNumber(obs1.accPoint).minus(obs0.accPoint);
    console.log('avg tick: ', Number(tickDelta.div(blockDelta).toFixed(10)))
    const avg = tickDelta.div(blockDelta)
    if (avg.gt(0)) {
        return Number(avg.toFixed(0, 3))
    } else {
        return Number(avg.toFixed(0, 2))
    }
}

function getTarget(obs0, obs1, targetTime) {
    const rate = BigNumber(obs1.accPoint).minus(obs0.accPoint).div(BigNumber(obs1.timestamp).minus(obs0.timestamp))
    const delta = BigNumber(targetTime).minus(obs0.timestamp)
    let avg = rate.times(delta)
    if (avg.gt(0)) {
        avg = avg.toFixed(0, 3)
    } else {
        avg = avg.toFixed(0, 2)
    }
    const targetAccPoint = BigNumber(obs0.accPoint).plus(avg).toFixed(0)
    return {
        timestamp: targetTime,
        accPoint: targetAccPoint
    }
}

async function movePriceDown(swap, trader, tokenX, tokenY, boundaryPt) {

    await swap.connect(trader).swapX2Y({
        tokenX: tokenX.address,
        tokenY: tokenY.address,
        fee: 2000,
        boundaryPt,
        recipient: trader.address,
        amount: '1000000000000000000000000000',
        maxPayed: '1000000000000000000000000000',
        minAcquired: '1',
        deadline: '0xffffffff',
    });

}

async function movePriceUp(swap, trader, tokenX, tokenY, boundaryPt) {

    await swap.connect(trader).swapY2X({
        tokenX: tokenX.address,
        tokenY: tokenY.address,
        fee: 2000,
        boundaryPt,
        recipient: trader.address,
        amount: '1000000000000000000000000000',
        maxPayed: '1000000000000000000000000000',
        minAcquired: '1',
        deadline: '0xffffffff',
    });
}

describe("test uniswap price oracle", function () {
    var signer, miner1, miner2, trader, tokenAProvider, tokenBProvider, recipient1, recipient2;

    var weth;
    var wethAddr;

    var uniFactory;
    var uniSwapRouter;
    var uniPositionManager;

    var tokenX;
    var tokenY;

    var rewardInfoA = {
      rewardtoken: undefined,
      provider: undefined,
      rewardPerBlock: undefined,
      accRewardPerShare: undefined,
    };
    var rewardInfoB = {
      token: undefined,
      provider: undefined,
      rewardPerBlock: undefined,
      accRewardPerShare: undefined,
    };

    var rewardLowerTick;
    var rewardUpperTick;

    var startBlock;
    var endBlock;

    var poolXYAddr;
    var pool;
    var sqrtPriceX_96;

    var mining2RewardNoBoost;

    var q96;

    var testOracle;
    
    beforeEach(async function() {
      
        [signer, miner, trader, receiver] = await ethers.getSigners();

        // a fake weth
        const tokenFactory = await ethers.getContractFactory("TestToken");
        weth = await tokenFactory.deploy('weth', 'weth', 18);
        wethAddr = weth.address;

        const {swapX2YModule, swapY2XModule, liquidityModule, limitOrderModule, flashModule} = await getPoolParts();
        izumiswapFactory = await getIzumiswapFactory(receiver.address, swapX2YModule, swapY2XModule, liquidityModule, limitOrderModule, flashModule, signer);
        nflm = await getNFTLiquidityManager(signer, izumiswapFactory.address, wethAddr);
        console.log("get nflm");
        swap = await getSwap(signer, izumiswapFactory.address, wethAddr);

        console.log("get swp");

        [tokenX, tokenY] = await getToken();
        await nflm.createPool(tokenX.address, tokenY.address, '2000', 8000)
        
        await tokenX.mint(miner.address, "100000000000000000000000");
        await tokenY.mint(miner.address, "100000000000000000000000");

        await tokenX.connect(miner).approve(nflm.address, "100000000000000000000000");
        await tokenY.connect(miner).approve(nflm.address, "100000000000000000000000");

        console.log("get xy");
        await nflm.connect(miner).mint({
            miner: miner.address,
            tokenX: tokenX.address,
            tokenY: tokenY.address,
            fee: '2000',
            pl: -30000,
            pr: 30000,
            xLim: '100000000000000000000000',
            yLim: '100000000000000000000000',
            amountXMin: 0,
            amountYMin: 0,
            deadline: '0xffffffff',
        });

        console.log('bbbbb')
        await tokenX.mint(trader.address, "1000000000000000000000000000");
        await tokenY.mint(trader.address, "1000000000000000000000000000");

        await tokenX.connect(trader).approve(swap.address, "1000000000000000000000000000");
        await tokenY.connect(trader).approve(swap.address, "1000000000000000000000000000");

        const TestOracle = await ethers.getContractFactory('TestOracle');
        testOracle = await TestOracle.deploy();
        await testOracle.deployed();

        q96 = BigNumber(2).pow(96);

        poolXYAddr = await nflm.pool(tokenX.address, tokenY.address, 2000);
        pool = await attachiZiSwapPool(poolXYAddr)

        console.log('aaaaa')
    });
    
    it("no swap", async function () {
        // var tick, sqrtPriceX96, currTick, currSqrtPriceX96;
        // [tick, sqrtPriceX96, currTick, currSqrtPriceX96] = await testOracle.getAvgPointPriceWithin2Hour(poolXYAddr);

        const oracle = await getOracle(testOracle, poolXYAddr);
        expect(oracle.point).to.equal(8000);
        expect(oracle.currentPoint).to.equal(8000);
    });

    it("after swaps but cardinality is only 1", async function() {
        
        await swap.connect(trader).swapX2Y({
            tokenX: tokenX.address,
            tokenY: tokenY.address,
            fee: 2000,
            boundaryPt: -2000,
            recipient: trader.address,
            amount: '1000000000000000000000000000',
            maxPayed: '1000000000000000000000000000',
            minAcquired: '1',
            deadline: '0xffffffff',
        });

        var state = await getState(pool);
        var oracle = await getOracle(testOracle, poolXYAddr);

        expect(oracle.point).to.equal(state.currentPoint);
        expect(oracle.sqrtPriceX96).to.equal(state.sqrtPrice_96);
        expect(oracle.currentPoint).to.equal(state.currentPoint);

    });


    it("num of observations does not reach cardinality, oldest within 2h", async function() {

        await pool.expandObservationQueue(8);

        await movePriceDown(swap, trader, tokenX, tokenY, 6000); // 2 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 3000); // 3 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 0);  // 4 obs
        await movePriceUp(swap, trader, tokenX, tokenY, 2000); // 5 obs
        await movePriceUp(swap, trader, tokenX, tokenY, 5000); // 6 obs

        await pool.expandObservationQueue(12);

        const state = await getState(pool);
        expect(state.observationCurrentIndex).to.equal(5);
        expect(state.observationQueueLen).to.equal(8);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs0 = await getObservation(pool, 0);
        var obs5 = await getObservation(pool, 5);

        var avgTick = getAvgTick(obs0, obs5);

        console.log('oracle price: ', fix962Float(oracle.sqrtPriceX96));
        console.log('expect price: ', BigNumber(1.0001).pow(avgTick).sqrt().toFixed(10));

        console.log(state.currentPoint);
        console.log('oracle tick: ', oracle.point);
        console.log('avg tick: ', avgTick);
        console.log(state.observationQueueLen);

        expect(Number(oracle.point)).to.equal(Number(avgTick));

    }); 

    it("num of observations reach cardinality, oldest within 2h", async function() {

        await pool.expandObservationQueue(8);

        await movePriceDown(swap, trader, tokenX, tokenY, 6000); // 2 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 3000); // 3 obs
        await movePriceDown(swap, trader, tokenX, tokenY, -3000);  // 4 obs
        await movePriceUp(swap, trader, tokenX, tokenY, -1000); // 5 obs
        await movePriceUp(swap, trader, tokenX, tokenY, 2000); // 6 obs
        await movePriceUp(swap, trader, tokenX, tokenY, 10000); // 7 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 5000);  // 8 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 4000);  // 9 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 3700);  // 10 obs
        await movePriceDown(swap, trader, tokenX, tokenY, 3500);  // 11 obs


        await pool.expandObservationQueue(12);

        var state = await getState(pool);
        expect(state.observationCurrentIndex).to.equal(2);
        expect(state.observationQueueLen).to.equal(8);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs2 = await getObservation(pool, 2);
        var obs3 = await getObservation(pool, 3);
        expect(obs3.init).to.equal(true);
        expect(obs2.init).to.equal(true);

        var avgTick = getAvgTick(obs2, obs3);

        console.log('oracle price: ', fix962Float(oracle.sqrtPriceX96));
        console.log('expect price: ', BigNumber(1.0001).pow(avgTick).sqrt().toFixed(10));

        console.log(state.currentPoint);
        console.log('oracle tick: ', oracle.point);
        console.log('avg tick: ', avgTick);
        console.log(state.observationNextQueueLen);

        expect(Number(oracle.point)).to.equal(Number(avgTick));

    }); 
    it("num of observations does not reach cardinality, oldest before 2h aglo", async function() {

        await pool.expandObservationQueue(10);

        await movePriceUp(swap, trader, tokenX, tokenY, 10000); // 2 obs, idx=1
        await ethers.provider.send('evm_increaseTime', [400]); 
        await movePriceDown(swap, trader, tokenX, tokenY, 6500); // 3 obs, idx=2
        await ethers.provider.send('evm_increaseTime', [7000]); 
        await movePriceDown(swap, trader, tokenX, tokenY, 1500); // 4 obs, idx=3
        await movePriceDown(swap, trader, tokenX, tokenY, -3000);  // 5 obs, idx=4
        await movePriceUp(swap, trader, tokenX, tokenY, 0); // 6 obs, idx=5

        await pool.expandObservationQueue(20);

        var s0 = await getState(pool);
        expect(s0.observationCurrentIndex).to.equal(5);
        expect(s0.observationQueueLen).to.equal(10);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs5 = await getObservation(pool, 5);
        var obs1 = await getObservation(pool, 1);
        var obs2 = await getObservation(pool, 2);
        expect(obs5.init).to.equal(true);
        expect(obs2.init).to.equal(true);

        var avgTick1 = getAvgTick(obs1, obs5);
        var avgTick2 = getAvgTick(obs2, obs5);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const targetTime = block.timestamp - 7200

        console.log('target time: ', targetTime)

        const targetObs = getTarget(obs1, obs2, targetTime)
        const stdAvgTick = getAvgTick(targetObs, obs5)
        console.log('oracle price: ', fix962Float(oracle.sqrtPriceX96));
        var oracleSqrtPrice = fix962Float(oracle.sqrtPriceX96);
        var sqrtPrice1 = Number(BigNumber(1.0001).pow(avgTick1).sqrt().toFixed(10));
        var sqrtPrice2 = Number(BigNumber(1.0001).pow(avgTick2).sqrt().toFixed(10));
        
        expect(oracleSqrtPrice).to.lessThanOrEqual(Math.max(sqrtPrice1, sqrtPrice2));
        expect(oracleSqrtPrice).to.greaterThanOrEqual(Math.min(sqrtPrice1, sqrtPrice2));

        console.log('oracle tick: ', oracle.point);
        console.log('avg tick1: ', avgTick1);
        console.log('avg tick2: ', avgTick2);

        expect(oracle.point).to.lessThanOrEqual(Math.max(avgTick1, avgTick2));
        expect(oracle.point).to.greaterThanOrEqual(Math.min(avgTick1, avgTick2));
        expect(oracle.point).to.equal(stdAvgTick)

    }); 

    it("num of observations reach cardinality, oldest before 2h ago, but [oldest, latest] within 1h", async function() {

        await pool.expandObservationQueue(10);

        await movePriceUp(swap, trader, tokenX, tokenY, 11000); // 2 obs, idx=1
        await movePriceDown(swap, trader, tokenX, tokenY, 7800); // 3 obs, idx=2
        await movePriceDown(swap, trader, tokenX, tokenY, 3100); // 4 obs, idx=3
        await movePriceDown(swap, trader, tokenX, tokenY, -5000);  // 5 obs, idx=4

        await movePriceUp(swap, trader, tokenX, tokenY, -3000); // 6 obs, idx=5
        await ethers.provider.send('evm_increaseTime', [3000]); 
        await movePriceUp(swap, trader, tokenX, tokenY, 2000); // 7 obs, idx=6
        await movePriceDown(swap, trader, tokenX, tokenY, 1500);  // 8 obs, idx=7
        await movePriceDown(swap, trader, tokenX, tokenY, -1000);  // 9 obs, idx=8
        await movePriceDown(swap, trader, tokenX, tokenY, -5000);  // 10 obs, idx=9

        await movePriceUp(swap, trader, tokenX, tokenY, -3000); // 10 obs, idx=0
        await movePriceUp(swap, trader, tokenX, tokenY, -2000); // 10 obs, idx=1
        await movePriceUp(swap, trader, tokenX, tokenY, -1200); // 10 obs, idx=2
        await ethers.provider.send('evm_increaseTime', [3500]); 

        await pool.expandObservationQueue(20);

        var s0 = await getState(pool);
        expect(s0.observationCurrentIndex).to.equal(2);
        expect(s0.observationQueueLen).to.equal(10);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs2 = await getObservation(pool, 2); // latest
        var obs3 = await getObservation(pool, 3); // oldest

        expect(obs2.init).to.equal(true);
        expect(obs3.init).to.equal(true);

        var avgTick = getAvgTick(obs3, obs2);

        console.log('avg tick 6: ', avgTick);
        console.log('oracle tick: ', oracle.point);

        expect(oracle.point).to.equal(avgTick);

    }); 
    it("num of observations reach cardinality, oldest before 2h ago, [oldest, latest] more than 1h, latest within 1h", async function() {

        await pool.expandObservationQueue(10);

        await movePriceUp(swap, trader, tokenX, tokenY, 12000); // 2 obs, idx=1
        await movePriceDown(swap, trader, tokenX, tokenY, 7000); // 3 obs, idx=2
        await movePriceDown(swap, trader, tokenX, tokenY, -2000); // 4 obs, idx=3
        await movePriceDown(swap, trader, tokenX, tokenY, -5000);  // 5 obs, idx=4

        await movePriceUp(swap, trader, tokenX, tokenY, -3000); // 6 obs, idx=5
        await ethers.provider.send('evm_increaseTime', [400]); 
        await movePriceUp(swap, trader, tokenX, tokenY, -1000); // 7 obs, idx=6
        await ethers.provider.send('evm_increaseTime', [5000]); 
        await movePriceDown(swap, trader, tokenX, tokenY, -2000);  // 8 obs, idx=7
        await movePriceDown(swap, trader, tokenX, tokenY, -2500);  // 9 obs, idx=8
        await movePriceDown(swap, trader, tokenX, tokenY, -3100);  // 10 obs, idx=9

        await movePriceUp(swap, trader, tokenX, tokenY, -2800); // 10 obs, idx=0
        await movePriceUp(swap, trader, tokenX, tokenY, -2700); // 10 obs, idx=1
        await movePriceUp(swap, trader, tokenX, tokenY, -2600); // 10 obs, idx=2
        await ethers.provider.send('evm_increaseTime', [2000]); 

        await pool.expandObservationQueue(20);

        var s0 = await getState(pool);
        expect(s0.observationCurrentIndex).to.equal(2);
        expect(s0.observationQueueLen).to.equal(10);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs2 = await getObservation(pool, 2);
        var obs5 = await getObservation(pool, 5);
        var obs6 = await getObservation(pool, 6);

        expect(obs2.init).to.equal(true);
        expect(obs5.init).to.equal(true);
        expect(obs6.init).to.equal(true);

        var avgTick5 = getAvgTick(obs5, obs2);
        var avgTick6 = getAvgTick(obs6, obs2);

        const blockNum = await ethers.provider.getBlockNumber();
        const block = await ethers.provider.getBlock(blockNum);
        const targetTime = block.timestamp - 7200

        console.log('target time: ', targetTime)

        const targetObs = getTarget(obs5, obs6, targetTime)
        const stdAvgTick = getAvgTick(targetObs, obs2)

        console.log('avg tick 5: ', avgTick5);
        console.log('avg tick 6: ', avgTick6);
        console.log('oracle tick: ', oracle.point);

        console.log('oracle price: ', fix962Float(oracle.sqrtPriceX96));
        var oracleSqrtPrice = fix962Float(oracle.sqrtPriceX96);
        var sqrtPrice5 = Number(BigNumber(1.0001).pow(avgTick5).sqrt().toFixed(10));
        var sqrtPrice6 = Number(BigNumber(1.0001).pow(avgTick6).sqrt().toFixed(10));
        expect(oracleSqrtPrice).to.lessThanOrEqual(Math.max(sqrtPrice5, sqrtPrice6));
        expect(oracleSqrtPrice).to.greaterThanOrEqual(Math.min(sqrtPrice5, sqrtPrice6));

        expect(oracle.point).to.lessThanOrEqual(Math.max(avgTick5, avgTick6));
        expect(oracle.point).to.greaterThanOrEqual(Math.min(avgTick5, avgTick6));
        expect(oracle.point).to.equal(stdAvgTick)

    }); 
    it("num of observations reach cardinality, oldest before 2h ago, [oldest, latest] more than 1h, but latest is before 1h ago", async function() {

        await pool.expandObservationQueue(10);

        await movePriceUp(swap, trader, tokenX, tokenY, 10000); // 2 obs, idx=1
        await movePriceDown(swap, trader, tokenX, tokenY, 3000); // 3 obs, idx=2
        await movePriceDown(swap, trader, tokenX, tokenY, 0); // 4 obs, idx=3
        await movePriceDown(swap, trader, tokenX, tokenY, -1000);  // 5 obs, idx=4

        await movePriceUp(swap, trader, tokenX, tokenY, 1000); // 6 obs, idx=5
        await ethers.provider.send('evm_increaseTime', [700]); 
        await movePriceUp(swap, trader, tokenX, tokenY, 3000); // 7 obs, idx=6
        await ethers.provider.send('evm_increaseTime', [3000]); 
        await movePriceDown(swap, trader, tokenX, tokenY, 2000);  // 8 obs, idx=7
        await movePriceDown(swap, trader, tokenX, tokenY, 1000);  // 9 obs, idx=8
        await movePriceDown(swap, trader, tokenX, tokenY, -5000);  // 10 obs, idx=9

        await movePriceUp(swap, trader, tokenX, tokenY, -3000); // 10 obs, idx=0
        await movePriceUp(swap, trader, tokenX, tokenY, -2000); // 10 obs, idx=1
        await movePriceUp(swap, trader, tokenX, tokenY, -100); // 10 obs, idx=2
        await ethers.provider.send('evm_increaseTime', [3700]); 

        await pool.expandObservationQueue(20);

        var s0 = await getState(pool);
        expect(s0.observationCurrentIndex).to.equal(2);
        expect(s0.observationQueueLen).to.equal(10);
        var oracle = await getOracle(testOracle, poolXYAddr);

        var obs2 = await getObservation(pool, 2);
        var obs5 = await getObservation(pool, 5);
        var obs6 = await getObservation(pool, 6);
        const targetTime = obs2.timestamp - 3600

        const targetObs = getTarget(obs5, obs6, targetTime)


        console.log('obs5: ', obs5)
        console.log('obs6: ', obs6)

        expect(obs2.init).to.equal(true);
        expect(obs5.init).to.equal(true);
        expect(obs6.init).to.equal(true);

        var avgTick5 = getAvgTick(obs5, obs2);
        var avgTick6 = getAvgTick(obs6, obs2);

        const stdAvgTick = getAvgTick(targetObs, obs2)

        console.log('avg tick 5: ', avgTick5);
        console.log('avg tick 6: ', avgTick6);
        console.log('oracle tick: ', oracle.point);

        console.log('oracle price: ', fix962Float(oracle.sqrtPriceX96));
        var oracleSqrtPrice = fix962Float(oracle.sqrtPriceX96);
        var sqrtPrice5 = Number(BigNumber(1.0001).pow(avgTick5).sqrt().toFixed(10));
        var sqrtPrice6 = Number(BigNumber(1.0001).pow(avgTick6).sqrt().toFixed(10));
        expect(oracleSqrtPrice).to.lessThanOrEqual(Math.max(sqrtPrice5, sqrtPrice6));
        expect(oracleSqrtPrice).to.greaterThanOrEqual(Math.min(sqrtPrice5, sqrtPrice6));

        expect(oracle.point).to.lessThanOrEqual(Math.max(avgTick5, avgTick6));
        expect(oracle.point).to.greaterThanOrEqual(Math.min(avgTick5, avgTick6));
        expect(oracle.point).to.equal(stdAvgTick)

    }); 
});