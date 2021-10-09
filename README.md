# NFT Collection Scaffold
Production-ready code for a rarity-based PFP (a.k.a 10k avatar) collection on Ethereum, Polygon (Matic), Binance Chain and any other EVM-compatible chain.

You only need to provide your assets, rarity traits,then you're ready to launch your collection on mainnet!

#### Current Features
* Algorithm to **randomly generate static images** based on multiple asset groups (e.g. hats, faces, bodies etc.)
* Ability to **reveal NFT metadata** after the mint, by uploading to IPFS.
* Deploy **ready-made smart contracts** to mainnet with a simple command.
* Ability to run pre-sales by allow-listing addresses.
* Controllable pre-sale, public sale and direct purchase toggles.
* Customizable maximum mints per transaction.
* Customizable maximum pre-sale mints per address.
* Guard against bots (malicious smart contracts) that try to front-run genuine collectors, using re-entrance checks and contract size.
* No gas fee for when collectors want to "list" NFTs from this collection. 
* Supports royalty for secondary sales on OpenSea and Rarible.
* Ready to integrate with [Flair](https://flair.finance) to provide various funding options to collectors.

#### Stack
* Solidity 0.8.x ([OpenZeppelin](https://docs.openzeppelin.com/contracts/4.x/))
* Hardhat
* TypeScript

# Usage

## 1. Clone this repo and prepare the configs
* Copy the `.env.dist` file to a file named `.env`, and then edit it to fill in the details. Enter your Etherscan API key, your Infura Access Key, and the private key of the account which will send the deployment transaction.
* Copy `collection.config.js.dist` to a file named `collection.config.js`, then update the details based on your collection info.
* Copy `assets.dist` directory to a directory named `assets`, then add your own layers and collection image.

## 2. Prepare your avatar assets, rarity traits and collection metadata
TODO

## 3. Deploy your smart contract
TODO

#### 3.1 Create smart contracts
TODO

#### 3.2 EtherScan verification

```shell
npx hardhat etherscan-verify --network rinkeby
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
