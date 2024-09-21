import { expect } from "chai";
import { ethers } from "hardhat";
import { DataMarketplace } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("DataMarketplace", function () {
  let dataMarketplace: DataMarketplace;
  let owner: HardhatEthersSigner;
  let addr1: HardhatEthersSigner;
  let addr2: HardhatEthersSigner;

  beforeEach(async function () {
    const DataMarketplace = await ethers.getContractFactory("DataMarketplace");
    [owner, addr1, addr2] = await ethers.getSigners();
    dataMarketplace = await DataMarketplace.deploy();
    await dataMarketplace.waitForDeployment();
  });

  describe("User Registration", function () {
    it("Should register a new user", async function () {
      const nullifierHash = ethers.encodeBytes32String("user1");
      await dataMarketplace.registerUser(nullifierHash);
      expect(await dataMarketplace.registeredUsers(nullifierHash)).to.be.true;
    });

    it("Should not register the same user twice", async function () {
      const nullifierHash = ethers.encodeBytes32String("user1");
      await dataMarketplace.registerUser(nullifierHash);
      await expect(dataMarketplace.registerUser(nullifierHash)).to.be.revertedWith("User already registered");
    });
  });

  describe("Data Purchase", function () {
    it("Should allow a registered user to purchase data", async function () {
      const buyerNullifierHash = ethers.encodeBytes32String("buyer");
      const sellerNullifierHash = ethers.encodeBytes32String("seller");
      const amount = ethers.parseEther("1");

      await dataMarketplace.registerUser(buyerNullifierHash);
      await dataMarketplace.registerUser(sellerNullifierHash);

      await expect(dataMarketplace.purchaseData(buyerNullifierHash, sellerNullifierHash, amount, { value: amount }))
        .to.emit(dataMarketplace, "DataPurchased")
        .withArgs(buyerNullifierHash, sellerNullifierHash, amount);
    });

    it("Should not allow unregistered users to purchase data", async function () {
      const buyerNullifierHash = ethers.encodeBytes32String("buyer");
      const sellerNullifierHash = ethers.encodeBytes32String("seller");
      const amount = ethers.parseEther("1");

      await expect(dataMarketplace.purchaseData(buyerNullifierHash, sellerNullifierHash, amount, { value: amount }))
        .to.be.revertedWith("Buyer not registered");
    });
  });

  describe("Balance Checking", function () {
    it("Should correctly update and return user balance after purchase", async function () {
      const buyerNullifierHash = ethers.encodeBytes32String("buyer");
      const sellerNullifierHash = ethers.encodeBytes32String("seller");
      const amount = ethers.parseEther("1");

      await dataMarketplace.registerUser(buyerNullifierHash);
      await dataMarketplace.registerUser(sellerNullifierHash);

      await dataMarketplace.purchaseData(buyerNullifierHash, sellerNullifierHash, amount, { value: amount });

      const sellerBalance = await dataMarketplace.getBalance(sellerNullifierHash);
      expect(sellerBalance).to.equal(amount * 70n / 100n); // 70% of the purchase amount
    });
  });

  describe("ROFL Interaction", function () {
    it("Should emit DataProcessed event when updateProcessedData is called", async function () {
      const buyerNullifierHash = ethers.encodeBytes32String("buyer");
      const processedData = "Processed data string";

      await expect(dataMarketplace.updateProcessedData(buyerNullifierHash, processedData))
        .to.emit(dataMarketplace, "DataProcessed")
        .withArgs(buyerNullifierHash, processedData);
    });
  });
});