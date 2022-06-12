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
  console.log(' - Uploading placeholder image to IPFS...');
  const { IpfsHash: imageHash } = await pinata.pinFromFS(
    path.resolve(collectionConfig.unrevealedPlaceholder),
  );
  console.log(` - IPFS Hash: ${imageHash}`);

  const contractMetadata = {
    name: collectionConfig.name,
    image: `ipfs://${imageHash}`,
  };

  const { IpfsHash: metadataHash } = await pinata.pinJSONToIPFS(
    contractMetadata,
  );

  fs.writeFileSync(
    `${distDirectory}/.placeholderURI`,
    `ipfs://${metadataHash}`,
  );
};

module.exports.tags = ['placeholder'];
