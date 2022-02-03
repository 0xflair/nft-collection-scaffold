const { expect } = require('chai');
const { v4: uuid } = require('uuid');
const web3 = require('web3');
const { setupTest } = require('../setup');

describe('StakableERC721Collection', () => {
  it('should stake and unstake a token', async () => {
    const { userA, userB, deployer } = await setupTest();

    await deployer.stakableTestCollection.togglePublicSale(true);
    await deployer.stakableTestCollection.togglePurchaseEnabled(true);

    await userA.stakableTestCollection.purchase(1, {
      value: web3.utils.toWei('0.08'),
    });

    await deployer.stakableTestCollection.grantRole(
      web3.utils.soliditySha3('STAKER_ROLE'),
      userB.signer.address,
    );

    await userB.stakableTestCollection.stake([1]);

    expect(await userA.stakableTestCollection.isStaked(1)).to.equal(true);

    await userB.stakableTestCollection.unstake([1]);

    expect(await userA.stakableTestCollection.isStaked(1)).to.equal(false);
  });

  it('should not be able to stake if not allowed', async () => {
    const { userA, userB, deployer } = await setupTest();

    await deployer.stakableTestCollection.togglePublicSale(true);
    await deployer.stakableTestCollection.togglePurchaseEnabled(true);

    await userA.stakableTestCollection.purchase(1, {
      value: web3.utils.toWei('0.08'),
    });

    await expect(userB.stakableTestCollection.stake([1])).to.be.revertedWith(
      'STAKABLE_ERC721/NOT_STAKER_ROLE',
    );
  });

  it('should not be able to unstake if not allowed', async () => {
    const { userA, userB, deployer } = await setupTest();

    await deployer.stakableTestCollection.togglePublicSale(true);
    await deployer.stakableTestCollection.togglePurchaseEnabled(true);

    await userA.stakableTestCollection.purchase(1, {
      value: web3.utils.toWei('0.08'),
    });

    await deployer.stakableTestCollection.grantRole(
      web3.utils.soliditySha3('STAKER_ROLE'),
      userB.signer.address,
    );

    await userB.stakableTestCollection.stake([1]);

    await deployer.stakableTestCollection.revokeRole(
      web3.utils.soliditySha3('STAKER_ROLE'),
      userB.signer.address,
    );

    await expect(userB.stakableTestCollection.unstake([1])).to.be.revertedWith(
      'STAKABLE_ERC721/NOT_STAKER_ROLE',
    );
  });
});
