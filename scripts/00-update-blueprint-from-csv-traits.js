const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const parse = require('csv-parse/lib/sync');

const blueprint = require('../blueprint.config.json');

const blueprintPath = path.resolve(__dirname, '../blueprint.config.json');

async function updateBlueprintFromCsv() {
  const traitsPath = path.resolve(
    path.resolve(__dirname, '../assets/traits.csv'),
  );
  const traitsContent = await fs.promises.readFile(traitsPath);
  const traitsItems = parse(traitsContent, {
    columns: true,
    skip_empty_lines: true,
  });
  const blueprintUpdates = { traits: {} };

  function set(value, ...path) {
    const currentValue = _.get(blueprintUpdates, path.join('.'));
    _.set(blueprintUpdates, path.join('.'), _.merge(currentValue || {}, value));
  }

  traitsItems.forEach((item) => {
    for (const [traitName, value] of Object.entries(item)) {
      if (!traitName || !value) continue;

      const [leftHand, traitDirectDependency] = value.split('@');
      const [traitValue, traitDependency] = leftHand.split('.');

      if (traitDependency) {
        const [depTraitName, depTraitValue] = traitDependency.split(':');

        set({}, 'traits', depTraitName, 'variations', depTraitValue);
      }

      if (traitDirectDependency) {
        const [depTraitName, depTraitValue] = traitDirectDependency.split(':');

        set(
          { variation: traitValue },
          'traits',
          depTraitName,
          'variations',
          depTraitValue,
          'directDependency',
          traitName,
        );
      }

      set({}, 'traits', traitName, 'variations', traitValue);
    }
  });

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

  return traitsItems.length;
}

updateBlueprintFromCsv()
  .then((result) => {
    console.log(`# Successfully updated ${result} layers`);
  })
  .catch((error) => {
    console.error(`# Failed to generate with error:`, error);
  });
