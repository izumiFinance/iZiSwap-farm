// SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.4;

// Uncomment if needed.
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

import "../libraries/FixedPoints.sol";
import "../libraries/Math.sol";

import "../iZiSwap/interfaces.sol";

import "../multicall.sol";

/// @title Interface for WETH9
interface IWETH9 is IERC20 {
    /// @notice Deposit ether to get wrapped ether
    function deposit() external payable;

    /// @notice Withdraw wrapped ether to get ether
    function withdraw(uint256) external;
}

/// @title Interface for WrapToken
interface IWrapToken {

    function depositFrom(address from, address to, uint256 amount) external returns(uint256 actualAmount);
    function withdraw(address to, uint256 amount) external returns(uint256 actualAmount);
}

abstract contract BaseWithWrapTimestamp is Ownable, Multicall, ReentrancyGuard {

    using SafeERC20 for IERC20;
    using EnumerableSet for EnumerableSet.UintSet;

    /// @dev Last time that the accRewardRerShare is touched.
    uint256 public lastTouchTime;

    /// @dev The time when NFT mining rewards starts/ends.
    uint256 public startTime;
    uint256 public endTime;
    struct RewardInfo {
        /// @dev Contract of the reward erc20 token.
        address rewardToken;
        /// @dev who provides reward
        address provider;
        /// @dev Accumulated Reward Tokens per share, times Q128.
        uint256 accRewardPerShare;
        /// @dev Reward amount for each second.
        uint256 rewardPerSecond;
    }

    mapping(uint256 => RewardInfo) public rewardInfos;
    uint256 public rewardInfosLen;

    /// @dev Store the owner of the NFT token
    mapping(uint256 => address) public owners;
    /// @dev The inverse mapping of owners.
    mapping(address => EnumerableSet.UintSet) internal tokenIds;

    /// @dev token to lock, 0 for not boost
    IERC20 public iziToken;
    /// @dev current total nIZI.
    uint256 public totalNIZI;

    /// @notice Current total virtual liquidity.
    uint256 public totalVLiquidity;

    /// @notice (1 - feeRemainPercent/100) is charging rate of iZiSwap fee
    uint24 public feeRemainPercent;

    uint256 public totalFeeChargedX;
    uint256 public totalFeeChargedY;

    string public contractType;


    struct PoolInfo {
        address tokenX;
        address tokenY;
        uint24 fee;
        bool tokenXIsWrap;
        bool tokenYIsWrap;
    }

    PoolInfo public rewardPool;

    address public weth;

    address public chargeReceiver;

    /// @notice emit if user successfully deposit
    /// @param user user
    /// @param tokenId id of mining (same as iZiSwap nft token id)
    /// @param nIZI amount of boosted iZi
    event Deposit(address indexed user, uint256 tokenId, uint256 nIZI);
    /// @notice emit if user successfully withdraw
    /// @param user user
    /// @param tokenId id of mining (same as iZiSwap nft token id)
    event Withdraw(address indexed user, uint256 tokenId);
    /// @notice emit if user successfully collect reward
    /// @param user user
    /// @param tokenId id of mining (same as iZiSwap nft token id)
    /// @param token address of reward erc-20 token
    /// @param amount amount of erc-20 token user received 
    event CollectReward(address indexed user, uint256 tokenId, address token, uint256 amount);
    /// @notice emit if contract owner successfully calls modifyEndTime(...)
    /// @param endTime endTime 
    event ModifyEndTime(uint256 endTime);
    /// @notice emit if contract owner successfully calls modifyRewardPerSecond(...)
    /// @param rewardToken address of reward erc20-token
    /// @param rewardPerSecond new reward per second of 'rewardToken'
    event ModifyRewardPerSecond(address indexed rewardToken, uint256 rewardPerSecond);
    /// @notice emit if contract owner successfully calls modifyProvider(...)
    /// @param rewardToken address of reward erc20-token
    /// @param provider New provider
    event ModifyProvider(address indexed rewardToken, address provider);

    function _setRewardPool(
        address tokenA,
        address tokenB,
        uint24 fee,
        bool tokenAIsWrap,
        bool tokenBIsWrap
    ) internal {
        (rewardPool.tokenX, rewardPool.tokenY) = (tokenA < tokenB)? (tokenA, tokenB) : (tokenB, tokenA);
        (rewardPool.tokenXIsWrap, rewardPool.tokenYIsWrap) = (tokenA < tokenB) ? (tokenAIsWrap, tokenBIsWrap) : (tokenBIsWrap, tokenAIsWrap);
        rewardPool.fee = fee;
        totalFeeChargedX = 0;
        totalFeeChargedY = 0;
    }

    constructor(
        uint24 _feeChargePercent, 
        address _iZiSwapLiquidityManager, 
        address tokenA, 
        address tokenB, 
        uint24 fee, 
        bool tokenAIsWrap,
        bool tokenBIsWrap,
        address _chargeReceiver,
        string memory _contractType
    ) {
        require(_feeChargePercent <= 100, "charge percent <= 100");
        feeRemainPercent = 100 - _feeChargePercent;
        // mark weth erc token
        weth = IiZiSwapLiquidityManager(_iZiSwapLiquidityManager).WETH9();
        // receiver to receive charged iZiSwap fee
        chargeReceiver = _chargeReceiver;
        _setRewardPool(tokenA, tokenB, fee, tokenAIsWrap, tokenBIsWrap);
        contractType = _contractType;
    }

    /// @notice Transfers ETH to the recipient address
    /// @dev Fails with `STE`
    /// @param to The destination of the transfer
    /// @param value The value to be transferred
    function _safeTransferETH(address to, uint256 value) internal {
        (bool success, ) = to.call{value: value}(new bytes(0));
        require(success, "STE");
    }

    function _transferTokenToUser(address token, bool isWrapToken, address to, uint256 value) internal returns(uint256 actualAmount) {
        if (value > 0) {
            if (token == address(weth)) {
                IWETH9(token).withdraw(value);
                _safeTransferETH(to, value);
            } else if (isWrapToken) {
                return IWrapToken(token).withdraw(to, value);
            } else {
                IERC20(token).safeTransfer(to, value);
            }
        }
        actualAmount = value;
    }

    /// @notice Update reward variables to be up-to-date.
    /// @param vLiquidity vLiquidity to add or minus
    /// @param isAdd add or minus
    function _updateVLiquidity(uint256 vLiquidity, bool isAdd) internal {
        if (isAdd) {
            totalVLiquidity = totalVLiquidity + vLiquidity;
        } else {
            totalVLiquidity = totalVLiquidity - vLiquidity;
        }

        // max lockBoostMultiplier is 3
        require(totalVLiquidity <= FixedPoints.Q128 * 3, "TOO MUCH LIQUIDITY STAKED");
    }

    /// @notice Update reward variables to be up-to-date.
    /// @param nIZI amount of boosted iZi to add or minus
    /// @param isAdd add or minus
    function _updateNIZI(uint256 nIZI, bool isAdd) internal {
        if (isAdd) {
            totalNIZI = totalNIZI + nIZI;
        } else {
            totalNIZI = totalNIZI - nIZI;
        }
    }

    /// @notice Update the global status.
    function _updateGlobalStatus() internal {
        if (block.timestamp <= lastTouchTime) {
            return;
        }
        if (lastTouchTime >= endTime) {
            return;
        }
        uint256 currTime = Math.min(block.timestamp, endTime);
        if (totalVLiquidity == 0) {
            lastTouchTime = currTime;
            return;
        }

        for (uint256 i = 0; i < rewardInfosLen; i++) {
            // tokenReward < 2^25 * 2^64 * 2^10, 15 years, 1000 r/second
            uint256 tokenReward = (currTime - lastTouchTime) * rewardInfos[i].rewardPerSecond;
            // tokenReward * Q128 < 2^(25 + 64 + 10 + 128)
            rewardInfos[i].accRewardPerShare = rewardInfos[i].accRewardPerShare + ((tokenReward * FixedPoints.Q128) / totalVLiquidity);
        }
        lastTouchTime = currTime;
    }

    /// @notice compute validVLiquidity
    /// @param vLiquidity origin vLiquidity
    /// @param nIZI amount of boosted iZi
    function _computeValidVLiquidity(uint256 vLiquidity, uint256 nIZI)
        internal virtual
        view
        returns (uint256);

    /// @notice update a token status when touched
    /// @param tokenId id of TokenStatus obj in sub-contracts (same with iZiSwap nft id)
    /// @param validVLiquidity validVLiquidity, can be acquired by _computeValidVLiquidity(...)
    /// @param nIZI latest amount of iZi boost
    function _updateTokenStatus(
        uint256 tokenId,
        uint256 validVLiquidity,
        uint256 nIZI
    ) internal virtual;


    struct BaseTokenStatus {
        uint256 vLiquidity;
        uint256 validVLiquidity;
        uint256 nIZI;
        uint256[] lastTouchAccRewardPerShare;
    }

    /// @notice get base infomation from token status in sub-contracts
    /// @param tokenId id of TokenStatus obj in sub-contracts
    /// @return t contains base infomation (uint256 vLiquidity, uint256 validVLiquidity, uint256 nIZI, uint256[] lastTouchAccRewardPerShare)
    function getBaseTokenStatus(uint256 tokenId) internal virtual view returns(BaseTokenStatus memory t);

    /// @notice deposit iZi to an nft token
    /// @param tokenId nft already deposited
    /// @param deltaNIZI amount of izi to deposit
    function depositIZI(uint256 tokenId, uint256 deltaNIZI)
        external
        nonReentrant
    {
        require(owners[tokenId] == msg.sender, "NOT OWNER or NOT EXIST");
        require(address(iziToken) != address(0), "NOT BOOST");
        require(deltaNIZI > 0, "DEPOSIT IZI MUST BE POSITIVE");
        _collectReward(tokenId);
        BaseTokenStatus memory t = getBaseTokenStatus(tokenId);
        _updateNIZI(deltaNIZI, true);
        uint256 nIZI = t.nIZI + deltaNIZI;
        // update validVLiquidity
        uint256 validVLiquidity = _computeValidVLiquidity(t.vLiquidity, nIZI);
        _updateTokenStatus(tokenId, validVLiquidity, nIZI);

        // transfer iZi from user
        iziToken.safeTransferFrom(msg.sender, address(this), deltaNIZI);
    }

    /// @notice Collect pending reward for a single position. can be called by sub-contracts
    /// @param tokenId The related position id.
    function _collectReward(uint256 tokenId) internal {
        BaseTokenStatus memory t = getBaseTokenStatus(tokenId);

        _updateGlobalStatus();
        for (uint256 i = 0; i < rewardInfosLen; i++) {
            // multiplied by Q128 before
            uint256 _reward = (t.validVLiquidity * (rewardInfos[i].accRewardPerShare - t.lastTouchAccRewardPerShare[i])) / FixedPoints.Q128;
            if (_reward > 0) {
                IERC20(rewardInfos[i].rewardToken).safeTransferFrom(
                    rewardInfos[i].provider,
                    msg.sender,
                    _reward
                );
            }
            emit CollectReward(
                msg.sender,
                tokenId,
                rewardInfos[i].rewardToken,
                _reward
            );
        }

        // update validVLiquidity
        uint256 validVLiquidity = _computeValidVLiquidity(t.vLiquidity, t.nIZI);
        _updateTokenStatus(tokenId, validVLiquidity, t.nIZI);
    }

    /// @notice View function to get position ids staked here for an user.
    /// @param _user The related address.
    /// @return list of tokenId
    function getTokenIds(address _user)
        external
        view
        returns (uint256[] memory)
    {
        EnumerableSet.UintSet storage ids = tokenIds[_user];
        // push could not be used in memory array
        // we set the tokenIdList into a fixed-length array rather than dynamic
        uint256[] memory tokenIdList = new uint256[](ids.length());
        for (uint256 i = 0; i < ids.length(); i++) {
            tokenIdList[i] = ids.at(i);
        }
        return tokenIdList;
    }
    
    /// @notice Return reward multiplier over the given _from to _to (timestamp).
    /// @param _from The start time.
    /// @param _to The end time.
    function _getRewardTime(uint256 _from, uint256 _to)
        internal
        view
        returns (uint256)
    {
        if (_from > _to) {
            return 0;
        }
        if (_to <= endTime) {
            return _to - _from;
        } else if (_from >= endTime) {
            return 0;
        } else {
            return endTime - _from;
        }
    }

    /// @notice View function to see pending Reward for a single position.
    /// @param tokenId The related position id.
    /// @return list of pending reward amount for each reward ERC20-token of tokenId
    function pendingReward(uint256 tokenId)
        public
        view
        returns (uint256[] memory)
    {
        BaseTokenStatus memory t = getBaseTokenStatus(tokenId);
        uint256[] memory _reward = new uint256[](rewardInfosLen);
        for (uint256 i = 0; i < rewardInfosLen; i++) {
            uint256 tokenReward = _getRewardTime(
                lastTouchTime,
                block.timestamp
            ) * rewardInfos[i].rewardPerSecond;
            uint256 rewardPerShare = rewardInfos[i].accRewardPerShare + (tokenReward * FixedPoints.Q128) / totalVLiquidity;
            // l * (currentAcc - lastAcc)
            _reward[i] = (t.validVLiquidity * (rewardPerShare - t.lastTouchAccRewardPerShare[i])) / FixedPoints.Q128;
        }
        return _reward;
    }

    /// @notice View function to see pending Rewards for an address.
    /// @param _user The related address.
    /// @return list of pending reward amount for each reward ERC20-token of this user
    function pendingRewards(address _user)
        external
        view
        returns (uint256[] memory)
    {
        uint256[] memory _reward = new uint256[](rewardInfosLen);
        for (uint256 j = 0; j < rewardInfosLen; j++) {
            _reward[j] = 0;
        }

        for (uint256 i = 0; i < tokenIds[_user].length(); i++) {
            uint256[] memory r = pendingReward(tokenIds[_user].at(i));
            for (uint256 j = 0; j < rewardInfosLen; j++) {
                _reward[j] += r[j];
            }
        }
        return _reward;
    }

    // Control fuctions for the contract owner and operators.

    /// @notice If something goes wrong, we can send back user's nft and locked assets
    /// @param tokenId The related position id.
    function emergenceWithdraw(uint256 tokenId) external virtual;

    /// @notice Set new reward end time.
    /// @param _endTime New end time.
    function modifyEndTime(uint256 _endTime) external onlyOwner {
        require(_endTime > block.timestamp, "OUT OF DATE");
        _updateGlobalStatus();
        // jump if origin endTime < block.timestamp
        lastTouchTime = block.timestamp;
        endTime = _endTime;
        emit ModifyEndTime(endTime);
    }

    /// @notice Set new reward per second.
    /// @param rewardIdx which rewardInfo to modify
    /// @param _rewardPerSecond new reward per second
    function modifyRewardPerSecond(uint256 rewardIdx, uint256 _rewardPerSecond)
        external
        onlyOwner
    {
        require(rewardIdx < rewardInfosLen, "OUT OF REWARD INFO RANGE");
        _updateGlobalStatus();
        rewardInfos[rewardIdx].rewardPerSecond = _rewardPerSecond;
        emit ModifyRewardPerSecond(
            rewardInfos[rewardIdx].rewardToken,
            _rewardPerSecond
        );
    }

    function modifyStartTime(uint256 _startTime) external onlyOwner {
        require(startTime > block.timestamp, 'has started!');
        require(_startTime > block.timestamp, 'Too Early!');
        require(_startTime < endTime, 'Too Late!');
        startTime = _startTime;
        lastTouchTime = _startTime;
    }


    /// @notice Set new reward provider.
    /// @param rewardIdx which rewardInfo to modify
    /// @param provider New provider
    function modifyProvider(uint256 rewardIdx, address provider)
        external
        onlyOwner
    {
        require(rewardIdx < rewardInfosLen, "OUT OF REWARD INFO RANGE");
        rewardInfos[rewardIdx].provider = provider;
        emit ModifyProvider(rewardInfos[rewardIdx].rewardToken, provider);
    }

    function modifyChargeReceiver(address _chargeReceiver) external onlyOwner {
        chargeReceiver = _chargeReceiver;
    }

    function collectFeeCharged() external nonReentrant {
        require(msg.sender == chargeReceiver, "NOT RECEIVER");
        _transferTokenToUser(rewardPool.tokenX, rewardPool.tokenXIsWrap, chargeReceiver, totalFeeChargedX);
        _transferTokenToUser(rewardPool.tokenY, rewardPool.tokenYIsWrap, chargeReceiver, totalFeeChargedY);
        totalFeeChargedX = 0;
        totalFeeChargedY = 0;
    }
}