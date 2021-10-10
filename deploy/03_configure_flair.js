const web3 = require('web3');

module.exports = async ({ getNamedAccounts, deployments, ethers }) => {
  const { deployer } = await getNamedAccounts();

  if (
    !hre.hardhatArguments ||
    !hre.hardhatArguments.network ||
    hre.hardhatArguments.network === 'hardhat'
  ) {
    console.log(
      ` - skipping Flair configuration on network: ${hre.hardhatArguments.network}`,
    );
    return;
  }

  const { FLAIR_REGISTRY_ADDRESS } = process.env;

  const signer = await ethers.getSigner(deployer);

  const flairProxyABI = [
    'function proxies(address) public view returns (address)',
    'function registerProxyFor(address) public returns (address)',
  ];
  const flairProxyContract = new ethers.Contract(
    FLAIR_REGISTRY_ADDRESS,
    flairProxyABI,
    signer,
  );

  let deployerProxyAddress;

  try {
    deployerProxyAddress = await flairProxyContract.proxies(deployer);
  } catch (error) {
    console.warn(
      'WARN: Proxy is not registered for deployer, will try to deploy now.',
    );
  }

  if (
    !deployerProxyAddress ||
    deployerProxyAddress === '0x0000000000000000000000000000000000000000'
  ) {
    console.log(' - Registering Flair proxy...');
    const tx = await flairProxyContract.registerProxyFor(deployer);
    const result = await tx.wait();
    console.log(
      ` - Registered Flair proxy via transaction (${result.hash}), waiting for confirmation...`,
    );
    deployerProxyAddress = await flairProxyContract.proxies(deployer);
    console.log(
      ` - Registered Flair proxy for your deployer address on ${deployerProxyAddress}`,
    );
  }

  console.log(` - Allowing Flair to fund NFTs for this collection...`);
  await deployments.execute(
    'ERC721Collection',
    { from: deployer },
    'grantRole',
    web3.utils.soliditySha3('MINTER_ROLE'),
    deployerProxyAddress,
  );
};

module.exports.tags = ['flair'];
module.exports.dependencies = [];
