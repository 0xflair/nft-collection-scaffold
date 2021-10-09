const path = require('path');
const fs = require('fs');

const collectionConfig = require('../collection.config');

const distDirectory = path.resolve(__dirname, '../dist');

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const contractURI = fs
    .readFileSync(`${distDirectory}/.contractURI`)
    .toString();
  const placeholderURI = fs
    .readFileSync(`${distDirectory}/.placeholderURI`)
    .toString();

  await deployments.deploy(collectionConfig.contract, {
    from: deployer,
    args: [
      collectionConfig.name,
      collectionConfig.symbol,
      collectionConfig.price,
      collectionConfig.maxTotalMint,
      collectionConfig.maxPreSaleMintPerAddress,
      collectionConfig.maxMintPerTransaction,
      collectionConfig.maxAllowedGasFee,
      contractURI,
      placeholderURI,
      collectionConfig.royaltyFeeRecipient,
      collectionConfig.openseaRegistryAddress,
    ],
    log: true,
    estimateGasExtra: 1000000,
  });
};

module.exports.tags = ['collection'];
