// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.3;

import '../ERC721Collection.sol';

/**
 * You can add any customized method here or override existing methods.
 */
contract SampleCreatures is ERC721Collection {
    constructor(
        string memory name,
        string memory symbol,
        uint256 price,
        uint256 maxTotalMint,
        uint256 maxPreSaleMintPerAddress,
        uint256 maxMintPerTransaction,
        uint256 maxAllowedGasFee,
        string memory contractURI,
        string memory placeholderURI,
        address raribleRoyaltyAddress,
        address openSeaProxyRegistryAddress
    )
        ERC721Collection(
            name,
            symbol,
            price,
            maxTotalMint,
            maxPreSaleMintPerAddress,
            maxMintPerTransaction,
            maxAllowedGasFee,
            contractURI,
            placeholderURI,
            raribleRoyaltyAddress,
            openSeaProxyRegistryAddress
        )
    {}
}
