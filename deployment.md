## mining

### compile

clone:

```
$ git clone git@github.com:izumiFinance/iZiSwap-farm.git
```

dependencies:

```
$ cd iZiSwap-farm
$ npm install
```

config secret key:

```
$ touch .secret.js
```

write following content in `.secret.js`

```
module.exports = {
    pk: '{your private key}',
    pkApiKey: '{api key for scan}', // optional 
}
```

compile:

```
$ npx hardhat compile
```

### deploy

Before this section we should complete previous sections. 

Here we take example of deployment on `bscTest`.

```
pool: iZi/BNB/2000
price range: 0.5*price ~ 2*price
boost: iZi (optional)
reward1: USDT 0.0001 per second
reward2: USDC 0.0002 per second (optional)
```

##### config liquidityManager and token

we need config `liquidityManager` and **all** corresponding token address on `bscTest`

write following content in `scripts/deployed.s`

```

contracts = {

    ...

    bscTest: {
        liquidityManager: '0xDE02C26c46AC441951951C97c8462cD85b3A124c',
        WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        iZi: '0x551197e6350936976DfFB66B2c3bb15DDB723250',
        USDT: '0x6AECfe44225A50895e9EC7ca46377B9397D1Bb5b',
        USDC: '0x876508837C162aCedcc5dd7721015E83cbb4e339',
    },

    ...

}

module.exports = contracts;
```

##### expand observation queue of pool

before deploying farm, we need expand observation queue of corresponding swap pool.

```
$ HARDHAT_NETWORK=bscTest node scripts/expandObservationQueue.js iZi WBNB 2000 50
```

here we expand observation queue of pool (iZi, WBNB, 2000), and expanded queue length is 50.

##### deploy farm with 2 rewards

for farm with 2 reward, the template of deploy command is shown as follows

```
HARDHAT_NETWORK='${network}' \
    node scripts/dynamicRangeTimestamp/deployDynamicRangeTwoRewardNFTSwitch.js \
    ${tokenASymbol} ${tokenBSymbol} ${feeContractNumber} \                 # token pair and fee of iZiSwapPool
    ${rewardSymbol1} ${amount per second} ${reward provider address} \
    ${rewardSymbol2} ${amount per second} ${reward provider address} \
    ${start timestamp} ${end timestamp} \
    ${left scale} ${right scale} \        # price range
    ${boostTokenSymbol} \                 # '0' if no boost
    100 \                                 # fee charge percent
    ${address to collect charged fee} \
    'true' | 'false'                      # whether use originLiquidity as vLiquidity, if false, vLiquidity = originLiquidity / 1e6
```

and in this example, the command is

```
HARDHAT_NETWORK='bscTest' \
    node scripts/dynamicRangeTimestamp/deployDynamicRangeTwoRewardNFTSwitch.js \
    iZi WBNB 2000 \
    USDT 0.0001 0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    USDC 0.0002 0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    1740058432 1771596632 \
    0.5 2 \
    iZi \
    100 \
    0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    false
```

and we can get output like following:

```
...
Deploying .....
boostAddr:  0x551197e6350936976DfFB66B2c3bb15DDB723250
tick range left:  6932
tick range right:  6932
constructor args:
module.exports = [
    ...
]
DynamicRangeTimestamp Contract Address:  0x48B8153635226984B10d44daB5be373D372aa651
```

the output will tell us deployed contract address and constructor args
(for verify).

**Notice:** reward token provider address should give approval


##### deploy farm with 1 reward

Assume we disable boost in this one-reward farm.

```
HARDHAT_NETWORK='bscTest' \
    node scripts/dynamicRangeTimestamp/deployDynamicRangeOneRewardNFTSwitch.js \
    iZi WBNB 2000 \
    USDT 0.0001 0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    1740058432 1771596632 \
    0.5 2 \
    0 \
    100 \
    0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    false
```

##### token pair with decimal 6

```
pool: USDT/USDC/400
price range: 0.9*price ~ 1.1*price
boost: iZi (optional)
reward: iZi 0.0001 per second
```

first, expand observation queue

```
$ HARDHAT_NETWORK=bscTest node scripts/expandObservationQueue.js USDT USDC 400 50
```

then deploy, **notice** that last parameter of command is **true**.

```
HARDHAT_NETWORK='bscTest' \
    node scripts/dynamicRangeTimestamp/deployDynamicRangeOneRewardNFTSwitch.js \
    USDT USDC 400 \
    iZi 0.0001 0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    1740058432 1771596632 \
    0.9 1.1 \
    iZi \
    100 \
    0xe90ebA9b7f3fC6a0B1aE28FfF4932cb9E35B6946 \
    true
```