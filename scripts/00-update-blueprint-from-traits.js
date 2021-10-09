const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const blueprint = require('../blueprint.config.json');

const assetsDirectory = path.resolve(__dirname, '../assets');
const blueprintPath = path.resolve(__dirname, '../blueprint.config.json');

async function updateBlueprintFromLayers() {
  const rootTraitsPath = path.resolve(assetsDirectory, 'traits');
  const rootTraitsItems = await fs.promises.readdir(rootTraitsPath);

  const blueprintUpdates = {
    traits: {},
  };

  function set(value, ...path) {
    const currentValue = _.get(blueprintUpdates.traits, path.join('.'));
    _.set(
      blueprintUpdates.traits,
      path.join('.'),
      _.merge(currentValue || {}, value),
    );
  }

  for (const rootTrait of rootTraitsItems) {
    const [overlayIndex, traitName, traitDependency] = rootTrait.split('.');

    if (traitDependency) {
      const [depTraitName, depTraitValue] = traitDependency.split(':');

      set({}, depTraitName, 'variations', depTraitValue);
    }

    const traitVariations = await fs.promises.readdir(
      path.resolve(rootTraitsPath, rootTrait),
    );

    const keyName = traitDependency || '_all_';

    for (const traitVariation of traitVariations) {
      const [variationName, probabilityPercent] = traitVariation
        .replace(/\.[^.]+$/, '')
        .split('.');

      set(
        {
          assets: {
            [keyName]: {
              layerImage: path.resolve(
                rootTraitsPath,
                rootTrait,
                traitVariation,
              ),
              overlayIndex: Number(overlayIndex),
            },
          },
          probabilityPercent: probabilityPercent
            ? Number(probabilityPercent.replace('_', '.'))
            : undefined,
        },
        traitName,
        'variations',
        variationName,
      );
    }
  }

  const updatedBlueprint = _.merge(blueprint, blueprintUpdates);

  for (const traitName of Object.keys(updatedBlueprint.traits)) {
    const variationNames = Object.keys(
      updatedBlueprint.traits[traitName].variations,
    );

    const remainingProbability =
      1 -
      Object.values(updatedBlueprint.traits[traitName].variations)
        .map((variation) =>
          variation.probabilityPercent ? variation.probabilityPercent / 100 : 0,
        )
        .reduce((p, c) => p + c);
    const withoutProbability = Object.values(
      updatedBlueprint.traits[traitName].variations,
    )
      .map((variation) => !!variation.probabilityPercent)
      .filter((p) => !p).length;

    if (withoutProbability > 0 && remainingProbability < 0) {
      throw new Error(
        `Cumulative probability for trait ${traitName} is more than 1.0 please update the blueprint for this trait. withoutProbability = ${withoutProbability} remainingProbability = ${remainingProbability}`,
      );
    } else {
      for (const variationName of variationNames) {
        if (
          !updatedBlueprint.traits[traitName].variations[variationName]
            .probabilityPercent
        ) {
          updatedBlueprint.traits[traitName].variations[
            variationName
          ].probabilityPercent =
            (remainingProbability / withoutProbability) * 100;
        }
      }
    }
  }

  fs.writeFileSync(blueprintPath, JSON.stringify(updatedBlueprint, null, 2));

  return rootTraitsItems.length;
}

updateBlueprintFromLayers()
  .then((result) => {
    console.log(`# Successfully updated ${result} layers`);
  })
  .catch((error) => {
    console.error(`# Failed to generate with error:`, error);
  });
