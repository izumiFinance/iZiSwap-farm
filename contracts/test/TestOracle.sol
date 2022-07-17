// SPDX-License-Identifier: BUSL-1.1
pragma solidity ^0.8.4;

import "../libraries/iZiSwapOracle.sol";

contract TestOracle {
    function getAvgPointPriceWithin2Hour(address pool)
        external view
        returns (int24 point, uint160 sqrtPriceX96, int24 currentPoint, uint160 currSqrtPriceX96) 
    {
        (point, sqrtPriceX96, currentPoint, currSqrtPriceX96) = iZiSwapOracle.getAvgPointPriceWithin2Hour(pool);
    }
}