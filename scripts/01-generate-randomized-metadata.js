const _ = require('lodash');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const blueprint = require('../blueprint.config');
const collectionConfig = require('../collection.config');

const distDirectory = path.resolve(__dirname, '../dist');

fs.mkdirSync(`${distDirectory}/images`, { recursive: true });
fs.mkdirSync(`${distDirectory}/metadata`, { recursive: true });

function weightedRandom(prob) {
  let i,
    sum = 0,
    r = Math.random();

  for (i in prob) {
    sum += prob[i];
    if (r <= sum) return i;
  }
}

function getRandomTraitsVariations() {
  const { traits } = blueprint;
  const names = Object.keys(blueprint.traits);
  const selectedVariations = {};

  for (const name of names) {
    const variations = Object.keys(traits[name]);
    const probabilities = Object.values(traits[name]).map(
      (variation) => variation.probabilityPercent / 100,
    );

    const prob = _.zipObject(variations, probabilities);
    const variationName = weightedRandom(prob);

    selectedVariations[name] = {
      name: variationName,
      ...traits[name][variationName],
    };
  }

  return selectedVariations;
}

async function generateImageAsset(traits) {
  const canvas = createCanvas(
    blueprint.settings.width,
    blueprint.settings.height,
  );
  const ctx = canvas.getContext('2d');

  const layers = Object.values(traits)
    .sort((a, b) => a.overlayIndex - b.overlayIndex)
    .filter((l) => l.layerImage);

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

  return canvas;
}

async function generateRandomizedMetadata() {
  for (
    let tokenId = 1, c = collectionConfig.maxTotalMint;
    tokenId <= c;
    tokenId++
  ) {
    console.log(`Generating metadata for token ${tokenId}...`);

    const traitsVariations = getRandomTraitsVariations();
    const image = await generateImageAsset(traitsVariations);

    fs.writeFileSync(
      `${distDirectory}/images/${tokenId}`,
      image.toBuffer('image/png'),
    );

    const metadata = {
      name: `${collectionConfig.nftTitlePrefix} #${tokenId}`,
      attributes: Object.entries(traitsVariations).map(
        ([trait_type, variation]) => {
          return {
            trait_type,
            value: variation.name,
          };
        },
      ),
    };

    fs.writeFileSync(
      `${distDirectory}/metadata/${tokenId}`,
      JSON.stringify(metadata, null, 2),
    );
  }

  return collectionConfig.maxTotalMint;
}

generateRandomizedMetadata()
  .then((result) => {
    console.log(`# Successfully generated ${result} metadata items`);
  })
  .catch((error) => {
    console.error(`# Failed to generate with error:`, error);
  });
