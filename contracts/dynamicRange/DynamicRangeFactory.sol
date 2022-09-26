// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "./DynamicRange.sol";

contract DynamicRangeFactory {
    function deploy(
        DynamicRange.PoolParams calldata poolParams,
        DynamicRange.RewardInfo[] calldata _rewardInfos,
        address iziTokenAddr,
        uint256 _startBlock,
        uint256 _endBlock,
        uint24 feeChargePercent,
        address _chargeReceiver,
        int24 _pointRangeLeft,
        int24 _pointRangeRight) external returns (address contractAddress){
        contractAddress = address(new DynamicRange(
            poolParams,
            _rewardInfos,
            iziTokenAddr,
            _startBlock,
            _endBlock,
            feeChargePercent,
            _chargeReceiver,
            _pointRangeLeft,
            _pointRangeRight
        ));
    }
}