// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "./DynamicRangeWithWrap.sol";

contract DynamicRangeWithWrapFactory {
    function deploy(
        DynamicRangeWithWrap.PoolParams calldata poolParams,
        DynamicRangeWithWrap.RewardInfo[] calldata _rewardInfos,
        address iziTokenAddr,
        uint256 _startBlock,
        uint256 _endBlock,
        uint24 feeChargePercent,
        address _chargeReceiver,
        int24 _pointRangeLeft,
        int24 _pointRangeRight) external returns (address contractAddress){
        contractAddress = address(new DynamicRangeWithWrap(
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