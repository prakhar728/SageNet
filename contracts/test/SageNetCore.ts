import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SageNetCore - Revised", function () {
  // Sample paper data for tests
  const samplePaper1 = {
    ipfsHash: "QmT7fzZRBGMZCxUeU4G1q9ypuSaQRx2nAKx6SpfMYQvFeF",
    title: "Decentralized Research Publishing",
    paperAbstract: "A study on Web3-powered research platforms"
  };
  
  const samplePaper2 = {
    ipfsHash: "QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn",
    title: "Soulbound Tokens for Academic Credentials",
    paperAbstract: "Using SBTs to secure academic authorship"
  };

  // Updated versioning data
  const updatedVersion = {
    ipfsHash: "QmUpdatedPaperHashForVersion2",
    changeNotes: "Updated literature review"
  };

  // We define a fixture to reuse the same setup in every test
  async function deploySageNetCoreFixture() {
    // Get signers
    const [owner, author1, author2, publisher, reviewContract] = await hre.ethers.getSigners();
    
    // Deploy the SageNetCore contract
    const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
    const sageNetCore = await SageNetCore.deploy();
    
    // Authorize the review contract as a status updater
    await sageNetCore.connect(owner).setStatusUpdater(reviewContract.address, true);
    
    return { sageNetCore, owner, author1, author2, publisher, reviewContract };
  }

  // Fixture with a paper already submitted
  async function deployWithPaperFixture() {
    const { sageNetCore, owner, author1, author2, publisher, reviewContract } = await loadFixture(deploySageNetCoreFixture);
    
    // Submit a paper as author1
    await sageNetCore.connect(author1).submitPaper(
      samplePaper1.ipfsHash,
      samplePaper1.title,
      samplePaper1.paperAbstract
    );
    
    return { sageNetCore, owner, author1, author2, publisher, reviewContract };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { sageNetCore, owner } = await loadFixture(deploySageNetCoreFixture);
      expect(await sageNetCore.owner()).to.equal(owner.address);
    });
    
    it("Should have the correct name and symbol", async function () {
      const { sageNetCore } = await loadFixture(deploySageNetCoreFixture);
      expect(await sageNetCore.name()).to.equal("SageNet Research SBT");
      expect(await sageNetCore.symbol()).to.equal("SAGESBT");
    });
    
    it("Should allow setting status updaters", async function () {
      const { sageNetCore, owner, reviewContract } = await loadFixture(deploySageNetCoreFixture);
      
      // Check that the review contract is authorized
      await expect(await sageNetCore.connect(reviewContract).isAuthor(9999)).to.be.revertedWith("Paper does not exist");
      
      // Set a new status updater
      await expect(sageNetCore.connect(owner).setStatusUpdater(owner.address, true))
        .to.emit(sageNetCore, "StatusUpdaterSet")
        .withArgs(owner.address, true);
    });
    
    it("Should not allow non-owners to set status updaters", async function () {
      const { sageNetCore, author1 } = await loadFixture(deploySageNetCoreFixture);
      
      await expect(
        sageNetCore.connect(author1).setStatusUpdater(author1.address, true)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Paper Submission", function () {
    it("Should allow a user to submit a paper and mint an SBT", async function () {
      const { sageNetCore, author1 } = await loadFixture(deploySageNetCoreFixture);
      
      // Submit paper as author1
      await sageNetCore.connect(author1).submitPaper(
        samplePaper1.ipfsHash,
        samplePaper1.title,
        samplePaper1.paperAbstract
      );
      
      // Token ID should be 1 for the first paper
      const paper = await sageNetCore.getPaper(1);
      
      // Verify paper data
      expect(paper.ipfsHash).to.equal(samplePaper1.ipfsHash);
      expect(paper.title).to.equal(samplePaper1.title);
      expect(paper.paperAbstract).to.equal(samplePaper1.paperAbstract);
      expect(paper.author).to.equal(author1.address);
      expect(paper.status).to.equal(0); // Draft status
      expect(paper._tokenId).to.equal(1);
      expect(paper.versionCount).to.equal(1); // First version
      
      // Verify token ownership
      expect(await sageNetCore.ownerOf(1)).to.equal(author1.address);
    });
    
    it("Should correctly identify author of a paper", async function () {
      const { sageNetCore, author1, author2 } = await loadFixture(deployWithPaperFixture);
      
      // Check that author1 is identified as the author
      expect(await sageNetCore.connect(author1).isAuthor(1)).to.equal(true);
      
      // Check that author2 is not identified as the author
      expect(await sageNetCore.connect(author2).isAuthor(1)).to.equal(false);
    });
  });

  describe("Paper Status Updates", function () {
    it("Should allow the author to update the paper status", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(author1).updatePaperStatus(1, 1); // Set to InApplication
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(1);
    });
    
    it("Should allow an authorized contract to update the paper status", async function () {
      const { sageNetCore, reviewContract } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(reviewContract).updatePaperStatus(1, 2); // Set to InReview
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(2);
    });
    
    it("Should not allow the owner to update the paper status", async function () {
      const { sageNetCore, owner } = await loadFixture(deployWithPaperFixture);
      
      // Try to update status as owner
      await expect(
        sageNetCore.connect(owner).updatePaperStatus(1, 3)
      ).to.be.revertedWith("Only author, publisher, or authorized contracts can update status");
    });
    
    it("Should not allow non-authors to update the paper status", async function () {
      const { sageNetCore, author2 } = await loadFixture(deployWithPaperFixture);
      
      // Try to update status as non-author
      await expect(
        sageNetCore.connect(author2).updatePaperStatus(1, 3)
      ).to.be.revertedWith("Only author, publisher, or authorized contracts can update status");
    });
  });

  describe("Publisher Interaction", function () {
    it("Should allow an author to submit to a publisher", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(author1).submitToPublisher(1, publisher.address);
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.publisher).to.equal(publisher.address);
      expect(paper.status).to.equal(1); // InApplication status
    });
    
    it("Should not allow non-authors to submit to a publisher", async function () {
      const { sageNetCore, author2, publisher } = await loadFixture(deployWithPaperFixture);
      
      await expect(
        sageNetCore.connect(author2).submitToPublisher(1, publisher.address)
      ).to.be.revertedWith("Only author can submit to publisher");
    });
    
    it("Should allow publishers to update the paper status", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      // Submit to publisher
      await sageNetCore.connect(author1).submitToPublisher(1, publisher.address);
      
      // Publisher updates status
      await sageNetCore.connect(publisher).updatePaperStatus(1, 3); // Set to Published
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(3);
    });
    
    it("Should correctly identify publishers", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      // Initially not a publisher
      expect(await sageNetCore.connect(publisher).isPublisher(1)).to.equal(false);
      
      // Submit to publisher
      await sageNetCore.connect(author1).submitToPublisher(1, publisher.address);
      
      // Now should be recognized as publisher
      expect(await sageNetCore.connect(publisher).isPublisher(1)).to.equal(true);
    });
  });

  describe("Paper Versioning", function () {
    it("Should allow the author to update paper and create a new version", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      // Update the paper with a new version
      await sageNetCore.connect(author1).updatePaperHash(
        1, 
        updatedVersion.ipfsHash, 
        updatedVersion.changeNotes
      );
      
      // Check that the paper was updated
      const paper = await sageNetCore.getPaper(1);
      expect(paper.ipfsHash).to.equal(updatedVersion.ipfsHash);
      expect(paper.versionCount).to.equal(2); // Second version
      
      // Check version history
      const versionHistory = await sageNetCore.getPaperVersionHistory(1);
      expect(versionHistory.length).to.equal(2);
      expect(versionHistory[1].ipfsHash).to.equal(updatedVersion.ipfsHash);
      expect(versionHistory[1].changeNotes).to.equal(updatedVersion.changeNotes);
    });
    
    it("Should not allow non-authors to update the paper", async function () {
      const { sageNetCore, author2 } = await loadFixture(deployWithPaperFixture);
      
      await expect(
        sageNetCore.connect(author2).updatePaperHash(
          1, 
          updatedVersion.ipfsHash, 
          updatedVersion.changeNotes
        )
      ).to.be.revertedWith("Only author can update paper");
    });
  });

  describe("Soulbound Functionality", function () {
    it("Should not allow token transfers", async function () {
      const { sageNetCore, author1, author2 } = await loadFixture(deployWithPaperFixture);
      
      await expect(
        sageNetCore.connect(author1).transferFrom(author1.address, author2.address, 1)
      ).to.be.revertedWith("SBT: tokens are non-transferable");
    });
  });
});