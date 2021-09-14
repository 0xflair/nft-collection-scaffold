# NFT Avatar Scaffold
Production-ready code for a PFP (a.k.a 10k avatar) collection on Ethereum, Polygon (Matic), Binance Chain and any other EVM-compatible chain.

#### Current Features
* Algorithm to **randomly generate static images** based on multiple asset groups (e.g. hats, faces, bodies etc.)
* Ability to **reveal NFT metadata** after the mint, by uploading to IPFS.
* Deploy **ready-made smart contracts** to mainnet with a simple command.
* Customizable minting start and deadline.
* Customizable maximum mints per transaction, per address, per hour.
* Guard against bots (malicious smart contracts) that try to front-run genuine collectors.
* Ready to integrate with [Flair](https://flair.finance) to provide various funding options to collectors.
* Ability to give Mint Passes to people as Pre-Sales

#### Stack
* Solidity 0.8.x ([OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/))
* Hardhat
* TypeScript

# Usage

## 1. Clone this repo and prepare the configs
In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place.

## 2. Prepare your avatar assets and rarity traits
TODO

## 3. Deploy your smart contract
TODO

#### 3.1 Create smart contracts
TODO

#### 3.2 EtherScan verification

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

## 4. Launch your project
TODO

## 4. Reveal metadata of the NFTs
TODO

# Best Practices
Now that you have decided to launch an NFT-based avatar collection, we'd like to share a few ideas that can help you succeed:

#### Design a fun and exciting rarity model
TODO

#### Provide a long-term utility for your community
TODO

#### Define royalties for sustainable business model
TODO

#### Avoid gas wars, flippers, paper hands and even whales!
TODO

# Use Cases

### Art Studios
TODO

### Game Developers
TODO

### Metaverse Citizen
TODO
