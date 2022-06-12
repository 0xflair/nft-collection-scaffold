const path = require('path');
const fs = require('fs');

const collectionConfig = require('../collection.config');
const { utils } = require('ethers');

const distDirectory = path.resolve(__dirname, '../dist');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const contractURI = fs
    .readFileSync(`${distDirectory}/.contractURI`)
    .toString();
  const placeholderURI = fs
    .readFileSync(`${distDirectory}/.placeholderURI`)
    .toString();

  await deployments.deploy('ERC721Collection', {
    from: deployer,
    args: [
      {
        name: collectionConfig.name,
        symbol: collectionConfig.symbol,
        maxSupply: collectionConfig.maxSupply,

        contractURI: contractURI,
        placeholderURI: placeholderURI,

        preSalePrice: collectionConfig.preSalePrice,
        preSaleMaxMintPerWallet: collectionConfig.preSaleMaxMintPerWallet,

        publicSalePrice: collectionConfig.publicSalePrice,
        publicSaleMaxMintPerTx: collectionConfig.publicSaleMaxMintPerTx,

        defaultRoyaltyAddress: collectionConfig.defaultRoyaltyAddress,
        defaultRoyaltyBps: collectionConfig.defaultRoyaltyBps,

        openSeaProxyRegistryAddress:
          collectionConfig.openSeaProxyRegistryAddress,
        openSeaExchangeAddress: collectionConfig.openSeaExchangeAddress,
        trustedForwarder: collectionConfig.trustedForwarder,
      },
    ],
    log: true,
    estimateGasExtra: 1000000,
  });
};

module.exports.tags = ['collection'];
