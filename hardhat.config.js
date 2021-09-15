require('dotenv').config();

require('hardhat-deploy');
require('@nomiclabs/hardhat-waffle');
require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');
require('solidity-coverage');
require('hardhat-contract-sizer');
require('hardhat-gas-reporter');

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const {
  INFURA_PROJECT_ID,
  DEPLOYER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
  GAS_PRICE,
  COIN_MARKET_CAP_API_KEY,
} = process.env;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.8.3',
    settings: {
      optimizer: {
        enabled: true,
        runs: 10,
      },
    },
  },
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      network_id: '*',
      gas: 12000000,
      blockGasLimit: 0x1fffffffffffff,
      allowUnlimitedContractSize: true,
      timeout: 1800000,
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${INFURA_PROJECT_ID}`,
      network_id: '*',
      gasPrice: GAS_PRICE && parseInt(GAS_PRICE),
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
    bsc_testnet: {
      url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
      chainId: 97,
      gasPrice: GAS_PRICE && parseInt(GAS_PRICE),
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      network_id: '*',
      gasPrice: GAS_PRICE && parseInt(GAS_PRICE),
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
    matic: {
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_PROJECT_ID}`,
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
    mumbai: {
      // url: `https://polygon-mumbai.infura.io/v3/${INFURA_PROJECT_ID}`,
      url: `https://matic-mumbai.chainstacklabs.com/`,
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
    arb_rinkeby: {
      url: 'https://rinkeby.arbitrum.io/rpc',
      gasPrice: 0,
      ...(DEPLOYER_PRIVATE_KEY
        ? { accounts: [`0x${DEPLOYER_PRIVATE_KEY}`] }
        : {}),
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
  contractSizer: {
    alphaSort: false,
    runOnCompile: false,
    disambiguatePaths: false,
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  gasReporter: {
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
    currency: 'USD',
    enabled: true,
  },
};
