// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.3;

import '@openzeppelin/contracts/utils/structs/BitMaps.sol';

import './interfaces/StakableInterface.sol';
import './ERC721Collection.sol';

contract StakableERC721Collection is ERC721Collection, StakableInterface {
    using BitMaps for BitMaps.BitMap;

    bytes32 public constant STAKER_ROLE = keccak256('STAKER_ROLE');

    BitMaps.BitMap internal stakedTokens;

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
    {
        _setupRole(STAKER_ROLE, _msgSender());
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Collection)
        returns (bool)
    {
        return
            interfaceId == type(StakableInterface).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * Locks token(s) to effectively stake them, while keeping in the same wallet.
     * This mechanism prevents them from being transferred, yet still will show correct owner.
     */
    function stake(uint256[] calldata tokenIds) public override nonReentrant {
        require(
            hasRole(STAKER_ROLE, msg.sender),
            'STAKABLE_ERC721/NOT_STAKER_ROLE'
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _stake(tokenIds[i]);
        }
    }

    /**
     * At this moment staking is only possible from a certain address (usually a smart contract).
     *
     * This is because in almost all cases you want another contract to perform custom logic on stake and unstake operations,
     * without allowing users to directly unstake their tokens and sell them, for example.
     */
    function _stake(uint256 tokenId) internal virtual {
        require(!stakedTokens.get(tokenId), 'STAKABLE_ERC721/ALREADY_STAKED');
        stakedTokens.set(tokenId);
    }

    /**
     * Unlocks staked token(s) to be able to transfer.
     */
    function unstake(uint256[] calldata tokenIds) public override nonReentrant {
        require(
            hasRole(STAKER_ROLE, msg.sender),
            'STAKABLE_ERC721/NOT_STAKER_ROLE'
        );

        for (uint256 i = 0; i < tokenIds.length; i++) {
            _unstake(tokenIds[i]);
        }
    }

    function _unstake(uint256 tokenId) internal virtual {
        require(stakedTokens.get(tokenId), 'STAKABLE_ERC721/NOT_STAKED');
        stakedTokens.unset(tokenId);
    }

    /**
     * Returns if a token is staked or not.
     */
    function isStaked(uint256 tokenId) public view override returns (bool) {
        return stakedTokens.get(tokenId);
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721) {
        require(!stakedTokens.get(tokenId), 'STAKABLE_ERC721/TOKEN_STAKED');
        super._beforeTokenTransfer(from, to, tokenId);
    }
}
