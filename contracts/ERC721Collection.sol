// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

import "@0xflair/evm-contracts/collections/ERC721/presets/ERC721FullFeaturedCollection.sol";

contract ERC721Collection is ERC721FullFeaturedCollection {
    constructor(Config memory config) ERC721FullFeaturedCollection(config) {}
}
