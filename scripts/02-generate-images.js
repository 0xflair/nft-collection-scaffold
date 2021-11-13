const _ = require('lodash');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const blueprint = require('../blueprint.config.json');
const collectionConfig = require('../collection.config');

const distDirectory = path.resolve(__dirname, '../dist');

fs.mkdirSync(`${distDirectory}/images`, { recursive: true });
fs.mkdirSync(`${distDirectory}/metadata`, { recursive: true });

async function gatherAssets(traits) {
  const assets = [];

  for (const traitName in traits) {
    if (!traits[traitName].assets) continue;

    if (traits[traitName].assets['_all_']) {
      assets.push(traits[traitName].assets['_all_']);
    } else {
      for (const dependency of Object.keys(traits[traitName].assets)) {
        const [depTraitName, depTraitValue] = dependency.split(':');
        if (traits[depTraitName].name === depTraitValue) {
          assets.push(traits[traitName].assets[dependency]);
          break;
        }
      }
    }
  }

  return assets;
}

async function generateImageAsset(traitsVariations, path) {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = createCanvas(
        blueprint.settings.width,
        blueprint.settings.height,
      );
      const ctx = canvas.getContext('2d');

      const assets = await gatherAssets(traitsVariations);

      const layers = _.sortBy(Object.values(assets), 'overlayIndex').filter(
        (l) => l.layerImage,
      );

      for (let i = 0, c = layers.length; i < c; i++) {
        const image = await loadImage(layers[i].layerImage);
        ctx.drawImage(
          image,
          0,
          0,
          blueprint.settings.width,
          blueprint.settings.height,
        );
      }

      const image = canvas.createJPEGStream({ quality: 1 });

      const out = fs.createWriteStream(path);
      out.on('finish', resolve);
      image.pipe(out);
    } catch (err) {
      reject(err);
    }
  });
}

function getTraitsVariations(tokenId) {
  return JSON.parse(
    fs.readFileSync(`${distDirectory}/variations/${tokenId}`).toString(),
  );
}

async function generateImages() {
  console.log(`# Generating images based on metadata...`, '\n');

  for (
    let tokenId = 1, c = collectionConfig.maxTotalMint;
    tokenId <= c;
    tokenId++
  ) {
    if (fs.existsSync(`${distDirectory}/images/${tokenId}`)) {
      console.log(` - Skipping ID = ${tokenId} as image exists.`);
      continue;
    }

    const traitsVariations = getTraitsVariations(tokenId);

    console.log(` - Generating image for token ${tokenId}...`);

    await generateImageAsset(
      traitsVariations,
      `${distDirectory}/images/${tokenId}`,
    );
  }

  return collectionConfig.maxTotalMint;
}

const start = new Date().getTime();
generateImages()
  .then(({ totalGenerated, totalSkipped }) => {
    console.log(
      `# Successfully generated ${totalGenerated} images and skipped ${totalSkipped}`,
    );
  })
  .catch((error) => {
    console.error(`# Failed to generate with error:`, error);
  })
  .finally(() => {
    const end = new Date().getTime();
    console.log(
      '# Execution time: ',
      Math.ceil((end - start) / 1000 / 60),
      'minutes',
    );
  });
