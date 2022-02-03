const { expect } = require('chai');
const { v4: uuid } = require('uuid');
const web3 = require('web3');
const { setupTest } = require('../setup');

describe('ERC721Collection', () => {
  it('should correctly set contract uri', async () => {
    const { deployer } = await setupTest();

    await deployer.testCollection.setContractURI('ipfs://new-contract-uri');

    expect(await deployer.testCollection.contractURI()).to.equal(
      'ipfs://new-contract-uri',
    );
  });

  describe('purchase', () => {
    it('should not be able to purchase when public is not active', async () => {
      const { userA } = await setupTest();

      await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
        'ERC721_COLLECTION/CANNOT_MINT',
      );
    });

    it('should not be able to purchase when public is active but direct purchase method is disabled', async () => {
      const { userA, deployer } = await setupTest();

      await deployer.testCollection.togglePublicSale(true);

      await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
        'ERC721_COLLECTION/PURCHASE_DISABLED',
      );
    });

    it('should not be able to purchase when not enough ether sent', async () => {
      const { userA, deployer } = await setupTest();

      await deployer.testCollection.togglePublicSale(true);
      await deployer.testCollection.togglePurchaseEnabled(true);

      await expect(userA.testCollection.purchase(1)).to.be.revertedWith(
        'ERC721_COLLECTION/INSUFFICIENT_ETH_AMOUNT',
      );
    });

    it('should be able to purchase when public is active and direct purchase method is enabled', async () => {
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

    it('should not be able to purchase more than allowed pre-sale limit', async () => {
      const { userA, deployer } = await setupTest();

      await deployer.testCollection.togglePublicSale(false);
      await deployer.testCollection.togglePreSale(true);
      await deployer.testCollection.togglePurchaseEnabled(true);
      await deployer.testCollection.addToPreSaleAllowList([
        userA.signer.address,
      ]);

      await userA.testCollection.purchase(2, {
        value: web3.utils.toWei('0.16'),
      });

      expect(
        await userA.testCollection.balanceOf(userA.signer.address),
      ).to.equal(2);

      await expect(
        userA.testCollection.purchase(1, {
          value: web3.utils.toWei('0.08'),
        }),
      ).to.be.revertedWith('ERC721_COLLECTION/CANNOT_MINT');
    });
  });
});
