const _ = require('lodash');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');
const fs = require('fs');

const blueprint = require('../blueprint.config.json');
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
    const variations = Object.keys(traits[name].variations);
    const probabilities = Object.values(traits[name].variations).map(
      (variation) => variation.probabilityPercent / 100,
    );

    const prob = _.zipObject(variations, probabilities);
    const variationName = weightedRandom(prob);

    selectedVariations[name] = {
      name: variationName,
      ...traits[name].variations[variationName],
    };
  }

  for (const constraint of blueprint.constraints) {
    if (constraint.type === 'repulsion') {
      let found = false;
      for (const repulser of constraint.list) {
        const [traitName, traitValue] = repulser.split(':');
        if (
          selectedVariations[traitName] &&
          traitValue &&
          selectedVariations[traitName].name === traitValue
        ) {
          if (found) {
            return null;
          } else {
            found = true;
          }
        }
      }
    } else if (constraint.type === 'dependency') {
      for (const depA of constraint.list) {
        const [traitNameA, traitValueA] = depA.split(':');
        let foundA = traitValueA
          ? selectedVariations[traitNameA] &&
            selectedVariations[traitNameA].name === traitValueA
          : !!selectedVariations[traitNameA];
        for (const depB of constraint.list) {
          const [traitNameB, traitValueB] = depB.split(':');
          let foundB = traitValueB
            ? selectedVariations[traitNameB] &&
              selectedVariations[traitNameB].name === traitValueB
            : !!selectedVariations[traitNameB];
          if ((foundA && !foundB) || (!foundA && foundB)) {
            return null;
          }
        }
      }
    } else if (constraint.type === 'coexistence') {
      let found = false;
      for (const lookup of constraint.lookup) {
        const [traitName, traitValue] = lookup.split(':');
        if (traitName && selectedVariations[traitName]) {
          if (traitValue) {
            if (selectedVariations[traitName].name === traitValue) {
              found = true;
              break;
            }
          } else {
            found = true;
            break;
          }
        }
      }
      if (found) {
        if (constraint.remove) {
          for (const item of constraint.remove) {
            const [traitName, traitValue] = item.split(':');
            if (
              !traitValue ||
              selectedVariations[traitName].name === traitValue
            ) {
              delete selectedVariations[traitName];
            }
          }
        }
      }
    } else {
      throw new Error(`Unsupported constraint type = ${constraint.type}`);
    }
  }

  return selectedVariations;
}

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

async function generateImageAsset(traitsVariations) {
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

  return canvas;
}

async function generateRandomizedMetadata() {
  for (
    let tokenId = 1, c = collectionConfig.maxTotalMint;
    tokenId <= c;
    tokenId++
  ) {
    if (
      fs.existsSync(`${distDirectory}/images/${tokenId}`) &&
      fs.existsSync(`${distDirectory}/metadata/${tokenId}`)
    ) {
      console.log(' - Skipping as metadata and image both exists.');
      continue;
    }

    process.stdout.write('.');
    const traitsVariations = getRandomTraitsVariations();

    if (!traitsVariations) {
      tokenId--;
      continue;
    }

    console.log(`Generating metadata and image for token ${tokenId}...`);

    const image = await generateImageAsset(traitsVariations);

    fs.writeFileSync(
      `${distDirectory}/images/${tokenId}`,
      image.toBuffer('image/png'),
    );

    const metadata = {
      name: `${collectionConfig.nftTitlePrefix} #${tokenId}`,
      attributes: Object.entries(traitsVariations)
        .filter(([traitName]) => !blueprint.traits[traitName].hiddenInMetadata)
        .map(([trait_type, variation]) => {
          return {
            trait_type: trait_type.replace('-', ' '),
            value: variation.name.replace('-', ' '),
          };
        }),
    };

    fs.writeFileSync(
      `${distDirectory}/metadata/${tokenId}`,
      JSON.stringify(metadata, null, 2),
    );
  }

  return collectionConfig.maxTotalMint;
}

const start = new Date().getTime();
generateRandomizedMetadata()
  .then((result) => {
    console.log(`# Successfully generated ${result} metadata items`);
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
