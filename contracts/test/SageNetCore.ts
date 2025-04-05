import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SageNetCore", function () {
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

  // We define a fixture to reuse the same setup in every test
  async function deploySageNetCoreFixture() {
    // Get signers
    const [owner, author1, author2, publisher] = await hre.ethers.getSigners();
    
    // Deploy the SageNetCore contract
    const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
    const sageNetCore = await SageNetCore.deploy();
    
    return { sageNetCore, owner, author1, author2, publisher };
  }

  // Fixture with a paper already submitted
  async function deployWithPaperFixture() {
    const { sageNetCore, owner, author1, author2, publisher } = await loadFixture(deploySageNetCoreFixture);
    
    // Submit a paper as author1
    await sageNetCore.connect(author1).submitPaper(
      samplePaper1.ipfsHash,
      samplePaper1.title,
      samplePaper1.paperAbstract
    );
    
    return { sageNetCore, owner, author1, author2, publisher };
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
      
      // Verify token ownership
      expect(await sageNetCore.ownerOf(1)).to.equal(author1.address);
    });
    
    it("Should emit a PaperSubmitted event", async function () {
      const { sageNetCore, author1 } = await loadFixture(deploySageNetCoreFixture);
      
      await expect(sageNetCore.connect(author1).submitPaper(
        samplePaper1.ipfsHash,
        samplePaper1.title,
        samplePaper1.paperAbstract
      ))
        .to.emit(sageNetCore, "PaperSubmitted")
        .withArgs(1, author1.address, samplePaper1.ipfsHash);
    });
    
    it("Should not allow duplicate paper submissions", async function () {
      const { sageNetCore, author1, author2 } = await loadFixture(deployWithPaperFixture);
      
      // Try to submit the same paper again
      await expect(
        sageNetCore.connect(author2).submitPaper(
          samplePaper1.ipfsHash,
          samplePaper1.title,
          samplePaper1.paperAbstract
        )
      ).to.be.revertedWith("Paper already exists");
    });
    
    it("Should allow multiple papers from the same author", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      // Submit second paper
      await sageNetCore.connect(author1).submitPaper(
        samplePaper2.ipfsHash,
        samplePaper2.title,
        samplePaper2.paperAbstract
      );
      
      // Get papers by author
      const papers = await sageNetCore.getPapersByAuthor(author1.address);
      expect(papers.length).to.equal(2);
      expect(papers[0]).to.equal(1);
      expect(papers[1]).to.equal(2);
    });
  });

  describe("Paper Status Updates", function () {
    it("Should allow the author to update the paper status", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(author1).updatePaperStatus(1, 1); // Set to InApplication
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(1);
    });
    
    it("Should emit a PaperStatusUpdated event", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      await expect(sageNetCore.connect(author1).updatePaperStatus(1, 1))
        .to.emit(sageNetCore, "PaperStatusUpdated")
        .withArgs(1, 1);
    });
    
    it("Should allow the owner to update the paper status", async function () {
      const { sageNetCore, owner } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(owner).updatePaperStatus(1, 2); // Set to InReview
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(2);
    });
    
    it("Should not allow non-authors to update the paper status", async function () {
      const { sageNetCore, author2 } = await loadFixture(deployWithPaperFixture);
      
      await expect(
        sageNetCore.connect(author2).updatePaperStatus(1, 3)
      ).to.be.revertedWith("Only author, publisher, or platform can update status");
    });
  });

  describe("Publisher Features", function () {
    it("Should allow an author to submit to a publisher", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      await sageNetCore.connect(author1).submitToPublisher(1, publisher.address);
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.publisher).to.equal(publisher.address);
      expect(paper.status).to.equal(1); // InApplication status
    });
    
    it("Should emit a PaperStatusUpdated event when submitting to publisher", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      await expect(sageNetCore.connect(author1).submitToPublisher(1, publisher.address))
        .to.emit(sageNetCore, "PaperStatusUpdated")
        .withArgs(1, 1); // InApplication status
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

  describe("Paper Updates", function () {
    it("Should allow the author to update the paper hash", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      const newHash = "QmNewHashForUpdatedPaper123456789";
      await sageNetCore.connect(author1).updatePaperHash(1, newHash);
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.ipfsHash).to.equal(newHash);
    });
    
    it("Should not allow non-authors to update the paper hash", async function () {
      const { sageNetCore, author2 } = await loadFixture(deployWithPaperFixture);
      
      const newHash = "QmNewHashForUpdatedPaper123456789";
      await expect(
        sageNetCore.connect(author2).updatePaperHash(1, newHash)
      ).to.be.revertedWith("Only author can update paper");
    });
  });

  describe("Paper Verification", function () {
    it("Should verify existing papers", async function () {
      const { sageNetCore } = await loadFixture(deployWithPaperFixture);
      
      const [exists, tokenId] = await sageNetCore.verifyPaper(samplePaper1.ipfsHash);
      expect(exists).to.equal(true);
      expect(tokenId).to.equal(1);
    });
    
    it("Should not verify non-existent papers", async function () {
      const { sageNetCore } = await loadFixture(deploySageNetCoreFixture);
      
      const [exists, tokenId] = await sageNetCore.verifyPaper("QmNonExistentHash");
      expect(exists).to.equal(false);
      expect(tokenId).to.equal(0);
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