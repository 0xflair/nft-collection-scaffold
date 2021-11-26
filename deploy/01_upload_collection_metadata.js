const path = require('path');
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');

const collectionConfig = require('../collection.config');

const distDirectory = path.resolve(__dirname, '../dist');

const pinata = pinataSDK(
  collectionConfig.pinataApiKey,
  collectionConfig.pinataSecretKey,
);

module.exports = async ({ getNamedAccounts, deployments }) => {
  console.log(' - Uploading collection image to IPFS...');
  const { IpfsHash: imageHash } = await pinata.pinFromFS(
    path.resolve(collectionConfig.collectionImage),
  );
  console.log(` - IPFS Hash: ${imageHash}`);

  const contractMetadata = {
    name: collectionConfig.name,
    description: collectionConfig.description,
    image: `ipfs://${imageHash}`,
    external_link: collectionConfig.externalLink,
    seller_fee_basis_points: collectionConfig.royaltyFee,
    fee_recipient: collectionConfig.royaltyFeeRecipient,
  };

  const { IpfsHash: metadataHash } = await pinata.pinJSONToIPFS(
    contractMetadata,
  );

  fs.writeFileSync(`${distDirectory}/.contractURI`, `ipfs://${metadataHash}`);
};

module.exports.tags = ['metadata'];
