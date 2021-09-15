// SPDX-License-Identifier: MIT

pragma solidity 0.8.3;

import "./BaseCollection.sol";

contract VisionaryTycoonsSociety is BaseCollection {
    constructor(
        string memory placeholderURI,
        address raribleRoyaltyAddress,
        address openSeaProxyRegistryAddress
    )
        BaseCollection(
            "Visionary Tycoons Society",
            "VTS",
            0.08 ether, // Price of each NFT if purchased directly on the smart contract
            10000, // Max Total Mint
            2, // Pre-sale mint per address
            10, // Max mint per transaction
            0, // Max allowed gas fee in gwei (0 = disabled)
            placeholderURI, // Unrevealed placeholder metadata URI
            raribleRoyaltyAddress, // Address that receives royalties for sales on Rarible
            openSeaProxyRegistryAddress // OpenSea registry address to avoid gas fees when collectors list
        )
    {}
}
