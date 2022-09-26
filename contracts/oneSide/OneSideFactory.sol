// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

import "./OneSide.sol";

contract OneSideFactory {
    function deploy(
        OneSide.PoolParams memory poolParams,
        OneSide.RewardInfo[] memory _rewardInfos,
        uint256 _lockBoostMultiplier,
        address iziTokenAddr,
        uint256 _startBlock,
        uint256 _endBlock,
        int24 _tickRangeLong,
        uint24 feeChargePercent,
        address _chargeReceiver
    ) external returns (address contractAddress){
        contractAddress = address(new OneSide(
            poolParams,
            _rewardInfos,
            _lockBoostMultiplier,
            iziTokenAddr,
            _startBlock,
            _endBlock,
            _tickRangeLong,
            feeChargePercent,
            _chargeReceiver
        ));
    }
}