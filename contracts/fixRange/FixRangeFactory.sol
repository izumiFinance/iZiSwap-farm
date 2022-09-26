// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "./FixRange.sol";

contract FixRangeFactory {
    function deploy(
        FixRange.PoolParams calldata poolParams,
        FixRange.RewardInfo[] calldata _rewardInfos,
        address iziTokenAddr,
        int24 _rewardUpperTick,
        int24 _rewardLowerTick,
        uint256 _startBlock,
        uint256 _endBlock,
        uint24 _feeChargePercent,
        address _chargeReceiver
    ) external returns (address contractAddress){
        contractAddress = address(new FixRange(
            poolParams,
            _rewardInfos,
            iziTokenAddr,
            _rewardUpperTick,
            _rewardLowerTick,
            _startBlock,
            _endBlock,
            _feeChargePercent,
            _chargeReceiver
        ));
    }
}