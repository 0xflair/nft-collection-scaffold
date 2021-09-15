module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();

  const { CONTRACT_METADATA_URI, OPENSEA_REGISTRY_ADDRESS } = process.env;

  await deployments.deploy('VisionaryTycoonsSociety', {
    from: deployer,
    args: [CONTRACT_METADATA_URI, deployer, OPENSEA_REGISTRY_ADDRESS],
    log: true,
    estimateGasExtra: 1000000,
  });
};

module.exports.tags = ['Collection'];
