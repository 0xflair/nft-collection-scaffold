const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const seedrandom = require('seedrandom');

const blueprint = require('../blueprint.config.json');
const collectionConfig = require('../collection.config');

const distDirectory = path.resolve(__dirname, '../dist');

fs.mkdirSync(`${distDirectory}/images`, { recursive: true });
fs.mkdirSync(`${distDirectory}/metadata`, { recursive: true });
fs.mkdirSync(`${distDirectory}/variations`, { recursive: true });

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
  const traitsToRemove = [];

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

    if (traits[name].variations[variationName].directDependency) {
      for (const directDepName of Object.keys(
        traits[name].variations[variationName].directDependency,
      )) {
        const directDepVariationName =
          traits[name].variations[variationName].directDependency[directDepName]
            .variation;
        selectedVariations[directDepName] = {
          name: directDepVariationName,
          ...traits[directDepName].variations[directDepVariationName],
        };
      }
    }
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

          if (depA === depB) continue;

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
              traitsToRemove.push(traitName);
            }
          }
        }
      }
    }
  }

  for (const traitName of traitsToRemove) {
    delete selectedVariations[traitName];
  }

  return selectedVariations;
}

function calculateActualDistribution(allMetadata, trait, variation) {
  // const traitName = trait.replace(/-/gi, ' ');
  // const traitValue = variation.replace(/-/gi, ' ');
  const allItems = allMetadata.filter((m) =>
    Object.entries(m.__traitsVariations).find(([k, v]) => {
      return k === trait && v.name === variation;
    }),
  );

  return (((allItems && allItems.length) || 0) / allMetadata.length) * 100;
}

async function generateRandomizedMetadata() {
  const allMetadata = [];

  const randomnessSeed =
    collectionConfig.randomnessSeed ||
    `${Math.floor(Math.random() * 10000000000)}` +
      `${Math.floor(Math.random() * 10000000000)}` +
      `${Math.floor(Math.random() * 10000000000)}` +
      `${Math.floor(Math.random() * 10000000000)}`;

  seedrandom(randomnessSeed, { global: true });

  console.log(
    `# Generating a list of metadata (Randomness Seed = ${randomnessSeed})...`,
    '\n',
  );

  for (
    let tokenId = 1, c = collectionConfig.maxTotalMint;
    tokenId <= c;
    tokenId++
  ) {
    const traitsVariations = getRandomTraitsVariations();

    if (!traitsVariations) {
      tokenId--;
      continue;
    }

    if (tokenId % 100 === 0) {
      process.stdout.write('.');
      if (tokenId % 500 === 0) {
        process.stdout.write(tokenId.toString());
      }
    }

    const metadata = {
      name: `${collectionConfig.nftTitlePrefix} #${tokenId}`,
      attributes: Object.entries(traitsVariations)
        .filter(([traitName]) => !blueprint.traits[traitName].hiddenInMetadata)
        .map(([trait_type, variation]) => {
          return {
            trait_type: trait_type.replace(/-/gi, ' '),
            value: variation.name.replace(/-/gi, ' '),
          };
        }),
      __traitsVariations: traitsVariations,
    };

    allMetadata.push(metadata);
  }

  console.log('\n', '\n', '# Checking for constraints...');

  const traitHashes = [];

  for (let x = 0, c = allMetadata.length; x < c; x++) {
    traitHashes[x] = _.sortBy(allMetadata[x].attributes, 'trait_type')
      .map((a) => `${a.trait_type}=${a.value}`)
      .join(',');
  }

  for (const constraint of blueprint.constraints) {
    if (constraint.type === 'no_duplicates') {
      console.log('\n', ' \\_ Checking for duplicates...');

      for (let x = 0, c = allMetadata.length; x < c; x++) {
        if (x % 100 === 0) {
          process.stdout.write('.');
          if (x % 500 === 0) {
            process.stdout.write(x.toString());
          }
        }

        for (let y = 0, l = allMetadata.length; y < l; y++) {
          if (x !== y && traitHashes[x] === traitHashes[y]) {
            console.log('\n', ' > Found a duplicate trying again...');
            return generateRandomizedMetadata();
          }
        }
      }
    } else if (constraint.type === 'trait_variation_range') {
      console.log('\n', ' \\_ Checking for trait appearance range...');
      let total = 0;
      let i = 0;

      for (const x of allMetadata) {
        i++;
        if (i % 100 === 0) {
          process.stdout.write('.');
          if (i % 500 === 0) {
            process.stdout.write(i.toString());
          }
        }

        let found = true;
        for (const item of constraint.list) {
          const [traitName, traitValue] = item.replace(/-/gi, ' ').split(':');
          if (
            !x.attributes.find(
              (a) => a.trait_type === traitName && a.value === traitValue,
            )
          ) {
            found = false;
            break;
          }
        }

        if (found) {
          total++;
        }
      }

      if (typeof constraint.max === 'number') {
        if (total > constraint.max) {
          console.log(
            '',
            ` > Found trait variations more than expected (found = ${total}, expected max = ${constraint.max}), trying again...`,
          );
          return generateRandomizedMetadata();
        }
      }

      if (typeof constraint.min === 'number') {
        if (total < constraint.min) {
          console.log(
            ` > Found trait variations less than expected (found = ${total}, expected min = ${constraint.min}), trying again...`,
          );
          return generateRandomizedMetadata();
        }
      }
    } else if (constraint.type === 'deviation') {
      console.log(
        '\n',
        ' \\_ Checking for trait count-distribution deviation...',
      );
      let i = 0;
      for (const traitName of Object.keys(blueprint.traits)) {
        if (blueprint.traits[traitName].hiddenInMetadata) {
          continue;
        }

        for (const variationName in blueprint.traits[traitName].variations) {
          i++;
          if (i % 10 === 0) {
            process.stdout.write(i.toString());
          }
          process.stdout.write('.');

          const definedProbability =
            blueprint.traits[traitName].variations[variationName]
              .probabilityPercent;
          const acceptableProbabilityLow =
            definedProbability -
            definedProbability * (constraint.tolerancePercent / 100);
          const acceptableProbabilityHigh =
            definedProbability +
            definedProbability * (constraint.tolerancePercent / 100);
          const actualDistribution = calculateActualDistribution(
            allMetadata,
            traitName,
            variationName,
          );
          if (
            acceptableProbabilityLow > actualDistribution ||
            acceptableProbabilityHigh < actualDistribution
          ) {
            console.log(
              ` > Found actual distribution for trait ${traitName}:${variationName} is ${actualDistribution} but only range ${acceptableProbabilityLow} - ${acceptableProbabilityHigh} is accepted, trying again...`,
            );
            return generateRandomizedMetadata();
          }
        }
      }
    }
  }

  console.log(
    '\n',
    '\n',
    `# Done generating ${allMetadata.length} metadata, writing to file...`,
  );

  for (let i = 0, c = allMetadata.length; i < c; i++) {
    fs.writeFileSync(
      `${distDirectory}/metadata/${(i + 1).toString()}`,
      JSON.stringify(
        { name: allMetadata[i].name, attributes: allMetadata[i].attributes },
        null,
        2,
      ),
    );
    fs.writeFileSync(
      `${distDirectory}/variations/${(i + 1).toString()}`,
      JSON.stringify(allMetadata[i].__traitsVariations, null, 2),
    );
  }

  return { total: allMetadata.length, randomnessSeed };
}

const start = new Date().getTime();

generateRandomizedMetadata()
  .then(({ total, randomnessSeed }) => {
    console.log(
      '\n',
      '\n',
      `# Successfully generated ${total} metadata items (Randomness Seed: ${randomnessSeed})`,
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
