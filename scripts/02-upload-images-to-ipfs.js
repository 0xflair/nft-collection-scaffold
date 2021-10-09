const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const pinataSDK = require('@pinata/sdk');

const collectionConfig = require('../collection.config');

const pinata = pinataSDK(
  collectionConfig.pinataApiKey,
  collectionConfig.pinataSecretKey,
);

const distDirectory = path.resolve(__dirname, '../dist');

async function uploadImagesToIPFS() {
  console.log(`Uploading all images to IPFS...`);
  const { IpfsHash } = await pinata.pinFromFS(
    path.resolve(distDirectory, 'images'),
  );

  const metadataPath = path.resolve(distDirectory, 'metadata');
  const metadataFiles = await fs.promises.readdir(metadataPath);

  for (const file of metadataFiles) {
    console.log(`Modifying ${file} metadata to update image...`);

    const fullPath = path.resolve(metadataPath, file);
    // Stat the file to see if we have a file or dir
    const stat = await fs.promises.stat(fullPath);

    if (stat.isFile()) {
      const metadata = JSON.parse(await fs.readFileSync(fullPath));

      fs.writeFileSync(
        fullPath,
        JSON.stringify(
          {
            ...metadata,
            image: `ipfs://${IpfsHash}/${file}`,
          },
          null,
          2,
        ),
      );
    }
  }

  return metadataFiles.length;
}

uploadImagesToIPFS()
  .then((result) => {
    console.log(
      `# Successfully uploaded ${result} images and updated their metadata files.`,
    );
  })
  .catch((error) => {
    console.error(`# Failed to upload images with error:`, error);
  });
