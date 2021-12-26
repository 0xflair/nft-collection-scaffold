const path = require('path');
const pinataSDK = require('@pinata/sdk');

const collectionConfig = require('../collection.config');

const pinata = pinataSDK(
  collectionConfig.pinataApiKey,
  collectionConfig.pinataSecretKey,
);

const distDirectory = path.resolve(__dirname, '../dist');

async function uploadMetadataToIPFS() {
  const { IpfsHash } = await pinata.pinFromFS(
    path.resolve(distDirectory, 'metadata'),
  );

  return IpfsHash;
}

uploadMetadataToIPFS()
  .then((result) => {
    console.log(
      `# Successfully uploaded metadata files to IPFS: ipfs://${result}/`,
    );
  })
  .catch((error) => {
    console.error(`# Failed to upload metadata with error:`, error);
  });
