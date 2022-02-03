// SPDX-License-Identifier: MIT

pragma solidity 0.8.3;

interface StakableInterface {
    function stake(uint256[] calldata tokenIds) external;

    function unstake(uint256[] calldata tokenIds) external;

    function isStaked(uint256 tokenId) external view returns (bool);
}
