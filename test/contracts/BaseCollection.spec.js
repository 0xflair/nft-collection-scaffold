const { expect } = require('chai');
const { v4: uuid } = require('uuid');
const web3 = require('web3');
const { setupTest } = require('../setup');

describe('BaseCollection', () => {
  it('should correctly set contract uri', async () => {
    const { deployer } = await setupTest();

    await deployer.testCollection.setContractURI('ipfs://new-contract-uri');

    expect(await deployer.testCollection.contractURI()).to.equal(
      'ipfs://new-contract-uri',
    );
  });

  it('should not be able to mint when public is not active', async () => {
    const { userA } = await setupTest();

    await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
      'BASE_COLLECTION/CANNOT_MINT',
    );
  });

  it('should not be able to mint when public is active but direct purchase method is disabled', async () => {
    const { userA, deployer } = await setupTest();

    await deployer.testCollection.togglePublicSale(true);

    await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
      'BASE_COLLECTION/PURCHASE_DISABLED',
    );
  });

  it('should not be able to mint when not enough ether sent', async () => {
    const { userA, deployer } = await setupTest();

    await deployer.testCollection.togglePublicSale(true);
    await deployer.testCollection.togglePurchaseEnabled(true);

    await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
      'BASE_COLLECTION/INSUFFICIENT_ETH_AMOUNT',
    );
  });

  it('should be able to mint when public is active and direct purchase method is enabled', async () => {
    const { userA, deployer } = await setupTest();

    await deployer.testCollection.togglePublicSale(true);
    await deployer.testCollection.togglePurchaseEnabled(true);

    await userA.testCollection.purchase(1, {
      value: web3.utils.toWei('0.08'),
    });

    expect(await userA.testCollection.ownerOf(1)).to.equal(
      userA.signer.address,
    );
  });
});
