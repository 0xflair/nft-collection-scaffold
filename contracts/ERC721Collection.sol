// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

import "hardhat/console.sol";

import "./opensea/ProxyRegistry.sol";
import "./rarible/IRoyalties.sol";
import "./rarible/LibPart.sol";
import "./rarible/LibRoyaltiesV2.sol";

contract ERC721Collection is ERC721Enumerable, Ownable, ReentrancyGuard, AccessControl, IRoyalties {
    using SafeMath for uint256;
    using Address for address;
    using Address for address payable;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    uint256 public PRICE;
    uint256 public MAX_TOTAL_MINT;

    // Fair distribution, thundering-herd mitigation and gas-wars prevention
    uint256 public MAX_PRE_SALE_MINT_PER_ADDRESS;
    uint256 public MAX_MINT_PER_TRANSACTION;
    uint256 public MAX_ALLOWED_GAS_FEE;

    bool private _isPreSaleActive;
    bool private _isPublicSaleActive;
    bool private _isPurchaseEnabled;
    string private _contractURI;
    string private _placeholderURI;
    string private _baseTokenURI;
    address private _raribleRoyaltyAddress;
    address private _openSeaProxyRegistryAddress;

    uint256 private _currentTokenId = 0;

    mapping(address => bool) private _preSaleAllowList;
    mapping(address => uint256) private _preSaleAllowListClaimed;

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
    ) ERC721(name, symbol) {
        PRICE = price;
        MAX_TOTAL_MINT = maxTotalMint;
        MAX_PRE_SALE_MINT_PER_ADDRESS = maxPreSaleMintPerAddress;
        MAX_MINT_PER_TRANSACTION = maxMintPerTransaction;
        MAX_ALLOWED_GAS_FEE = maxAllowedGasFee;

        _contractURI = contractURI;
        _placeholderURI = placeholderURI;
        _raribleRoyaltyAddress = raribleRoyaltyAddress;
        _openSeaProxyRegistryAddress = openSeaProxyRegistryAddress;

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    // ADMIN

    function togglePublicSale(bool isActive) external onlyOwner {
        _isPublicSaleActive = isActive;
    }

    function togglePreSale(bool isActive) external onlyOwner {
        _isPreSaleActive = isActive;
    }

    function togglePurchaseEnabled(bool isActive) external onlyOwner {
        _isPurchaseEnabled = isActive;
    }

    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }

    function setPlaceholderURI(string memory placeholderURI) external onlyOwner {
        _placeholderURI = placeholderURI;
    }

    function setContractURI(string memory uri) external onlyOwner {
        _contractURI = uri;
    }

    function setMaxAllowedGasFee(uint256 maxFeeGwei) external onlyOwner {
        MAX_ALLOWED_GAS_FEE = maxFeeGwei;
    }

    function setRaribleRoyaltyAddress(address addr) external onlyOwner {
        _raribleRoyaltyAddress = addr;
    }

    function setOpenSeaProxyRegistryAddress(address addr) external onlyOwner {
        _openSeaProxyRegistryAddress = addr;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;

        payable(msg.sender).transfer(balance);
    }

    // PUBLIC

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

    function tokenURI(uint256 _tokenId) override public view returns (string memory) {
        return bytes(_baseTokenURI).length > 0 ? string(abi.encodePacked(_baseTokenURI, Strings.toString(_tokenId))) : _placeholderURI;
    }

    function getRaribleV2Royalties(uint256 id) override external view returns (LibPart.Part[] memory result) {
        result = new LibPart.Part[](1);

        result[0].account = payable(_raribleRoyaltyAddress);
        result[0].value = 10000; // 100% of royalty goes to defined address above.
        id; // avoid unused param warning
    }

    function getInfo() external view returns (
        uint256 price,
        uint256 totalSupply,
        uint256 senderBalance,
        uint256 senderPreSaleClaimed,
        uint256 maxTotalMint,
        uint256 maxPreSaleMintPerAddress,
        uint256 maxMintPerTransaction,
        uint256 maxAllowedGasFee,
        bool isPreSaleActive,
        bool isPublicSaleActive,
        bool isPurchaseEnabled,
        bool isSenderAllowlisted
    ) {
        return (
            PRICE,
            this.totalSupply(),
            this.balanceOf(msg.sender),
            _preSaleAllowListClaimed[msg.sender],
            MAX_TOTAL_MINT,
            MAX_PRE_SALE_MINT_PER_ADDRESS,
            MAX_MINT_PER_TRANSACTION,
            MAX_ALLOWED_GAS_FEE,
            _isPreSaleActive,
            _isPublicSaleActive,
            _isPurchaseEnabled,
            _preSaleAllowList[msg.sender]
        );
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
    public
    view
    virtual
    override(ERC721Enumerable, AccessControl)
    returns (bool)
    {
        if(interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
            return true;
        }

        return super.supportsInterface(interfaceId);
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-less listings.
     */
    function isApprovedForAll(address owner, address operator)
    override
    public
    view
    returns (bool)
    {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(_openSeaProxyRegistryAddress);
        if (address(proxyRegistry.proxies(owner)) == operator) {
            return true;
        }

        return super.isApprovedForAll(owner, operator);
    }

    function addToPreSaleAllowList(address[] calldata addresses) external onlyOwner {
        for (uint256 i = 0; i < addresses.length; i++) {
            require(addresses[i] != address(0), "Can't add the null address");

            _preSaleAllowList[addresses[i]] = true;
        }
    }

    function onPreSaleAllowList(address addr) external view returns (bool) {
        return _preSaleAllowList[addr];
    }

    /**
     * Mints a specified number of tokens to an address without requiring payment.
     * Caller must be an address with MINTER role.
     *
     * Useful for gifting by owner or integration with Flair.Finance funding options.
     */
    function mint(address to, uint256 count) public nonReentrant {
        // Only allow minters to bypass the payment
        require(hasRole(MINTER_ROLE, msg.sender), "BASE_COLLECTION/NOT_MINTER_ROLE");

        // Make sure minting is allowed
        requireMintingConditions(to, count);

        if (_isPreSaleActive) {
            _preSaleAllowListClaimed[to] += count;
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 newTokenId = _getNextTokenId();
            _safeMint(to, newTokenId);
            _incrementTokenId();
        }
    }

    /**
     * Accepts required payment and mints a specified number of tokens to an address.
     * This method also checks if direct purchase is enabled.
     */
    function purchase(uint256 count) public payable nonReentrant {
        // Caller cannot be a smart contract to avoid front-running by bots
        require(!msg.sender.isContract(), 'BASE_COLLECTION/CONTRACT_CANNOT_CALL');

        // Make sure minting is allowed
        requireMintingConditions(msg.sender, count);

        // Sent value matches required ETH amount
        require(_isPurchaseEnabled, 'BASE_COLLECTION/PURCHASE_DISABLED');

        // Sent value matches required ETH amount
        require(PRICE * count <= msg.value, 'BASE_COLLECTION/INSUFFICIENT_ETH_AMOUNT');

        if (_isPreSaleActive) {
            _preSaleAllowListClaimed[msg.sender] += count;
        }

        for (uint256 i = 0; i < count; i++) {
            uint256 newTokenId = _getNextTokenId();
            _safeMint(msg.sender, newTokenId);
            _incrementTokenId();
        }
    }

    /**
     * Useful for when user wants to return tokens to get a refund,
     * or when they want to transfer lots of tokens by paying gas fee only once.
     */
    function transferFromBulk(
        address from,
        address to,
        uint256[] memory tokenIds
    ) public virtual {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            //solhint-disable-next-line max-line-length
            require(_isApprovedOrOwner(_msgSender(), tokenIds[i]), "ERC721: transfer caller is not owner nor approved");
            _transfer(from, to, tokenIds[i]);
        }
    }

    // PRIVATE

    /**
     * This method checks if ONE of these conditions are met:
     *   - Public sale is active.
     *   - Pre-sale is active and receiver is allowlisted.
     *
     * Additionally ALL of these conditions must be met:
     *   - Gas fee must be equal or less than maximum allowed.
     *   - Newly requested number of tokens will not exceed maximum total supply.
     */
    function requireMintingConditions(address to, uint256 count) internal view {
        require(
            // Either public sale is active
            _isPublicSaleActive ||

            // Or, pre-sale is active AND address is allow-listed AND address have not minted more than max allowed
            (
                _isPreSaleActive &&
                _preSaleAllowList[to] &&
                _preSaleAllowListClaimed[to] + count <= MAX_PRE_SALE_MINT_PER_ADDRESS
            )
        , "BASE_COLLECTION/CANNOT_MINT");

        // If max-gas fee is configured (avoid gas wars), transaction must not exceed that
        if (MAX_ALLOWED_GAS_FEE > 0)
            require(tx.gasprice < MAX_ALLOWED_GAS_FEE * 1000000000, "BASE_COLLECTION/GAS_FEE_NOT_ALLOWED");

        // Total minted tokens must not exceed maximum supply
        require(totalSupply() + count <= MAX_TOTAL_MINT, "BASE_COLLECTION/EXCEEDS_MAX_SUPPLY");

        // Number of minted tokens must not exceed maximum limit per transaction
        require(count <= MAX_MINT_PER_TRANSACTION, "BASE_COLLECTION/EXCEEDS_MAX_PER_TX");
    }

    /**
     * Calculates the next token ID based on value of _currentTokenId
     * @return uint256 for the next token ID
     */
    function _getNextTokenId() private view returns (uint256) {
        return _currentTokenId.add(1);
    }

    /**
     * Increments the value of _currentTokenId
     */
    function _incrementTokenId() private {
        _currentTokenId++;
    }
}
