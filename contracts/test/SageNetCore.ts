import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SageNetCore - Enhanced", function () {
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

  const thirdVersion = {
    ipfsHash: "QmThirdVersionHashForPaper",
    changeNotes: "Added experimental results"
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
      expect(paper.versionCount).to.equal(1); // First version
      
      // Verify token ownership
      expect(await sageNetCore.ownerOf(1)).to.equal(author1.address);
    });
    
    it("Should initialize version history on submission", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      const versionHistory = await sageNetCore.getPaperVersionHistory(1);
      expect(versionHistory.length).to.equal(1);
      expect(versionHistory[0].ipfsHash).to.equal(samplePaper1.ipfsHash);
      expect(versionHistory[0].changeNotes).to.equal("Initial submission");
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
    
    it("Should emit a PaperVersionAdded event", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      await expect(sageNetCore.connect(author1).updatePaperHash(
        1, 
        updatedVersion.ipfsHash, 
        updatedVersion.changeNotes
      ))
        .to.emit(sageNetCore, "PaperVersionAdded")
        .withArgs(1, samplePaper1.ipfsHash, updatedVersion.ipfsHash, 2);
    });
    
    it("Should allow multiple versions to be tracked", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      // Add version 2
      await sageNetCore.connect(author1).updatePaperHash(
        1, 
        updatedVersion.ipfsHash, 
        updatedVersion.changeNotes
      );
      
      // Add version 3
      await sageNetCore.connect(author1).updatePaperHash(
        1, 
        thirdVersion.ipfsHash, 
        thirdVersion.changeNotes
      );
      
      // Check that the paper was updated
      const paper = await sageNetCore.getPaper(1);
      expect(paper.ipfsHash).to.equal(thirdVersion.ipfsHash);
      expect(paper.versionCount).to.equal(3); // Third version
      
      // Check version history
      const versionHistory = await sageNetCore.getPaperVersionHistory(1);
      expect(versionHistory.length).to.equal(3);
      expect(versionHistory[0].ipfsHash).to.equal(samplePaper1.ipfsHash);
      expect(versionHistory[1].ipfsHash).to.equal(updatedVersion.ipfsHash);
      expect(versionHistory[2].ipfsHash).to.equal(thirdVersion.ipfsHash);
    });
    
    it("Should allow retrieving a specific version", async function () {
      const { sageNetCore, author1 } = await loadFixture(deployWithPaperFixture);
      
      // Add version 2
      await sageNetCore.connect(author1).updatePaperHash(
        1, 
        updatedVersion.ipfsHash, 
        updatedVersion.changeNotes
      );
      
      // Add version 3
      await sageNetCore.connect(author1).updatePaperHash(
        1, 
        thirdVersion.ipfsHash, 
        thirdVersion.changeNotes
      );
      
      // Get version 1 (initial submission)
      const version1 = await sageNetCore.getPaperVersion(1, 1);
      expect(version1.ipfsHash).to.equal(samplePaper1.ipfsHash);
      expect(version1.changeNotes).to.equal("Initial submission");
      
      // Get version 2
      const version2 = await sageNetCore.getPaperVersion(1, 2);
      expect(version2.ipfsHash).to.equal(updatedVersion.ipfsHash);
      expect(version2.changeNotes).to.equal(updatedVersion.changeNotes);
      
      // Get version 3
      const version3 = await sageNetCore.getPaperVersion(1, 3);
      expect(version3.ipfsHash).to.equal(thirdVersion.ipfsHash);
      expect(version3.changeNotes).to.equal(thirdVersion.changeNotes);
    });
    
    it("Should prevent retrieving non-existent versions", async function () {
      const { sageNetCore } = await loadFixture(deployWithPaperFixture);
      
      // Try to get version 0 (invalid)
      await expect(
        sageNetCore.getPaperVersion(1, 0)
      ).to.be.revertedWith("Invalid version number");
      
      // Try to get version 2 (doesn't exist yet)
      await expect(
        sageNetCore.getPaperVersion(1, 2)
      ).to.be.revertedWith("Invalid version number");
    });
    
    it("Should not allow non-authors to add versions", async function () {
      const { sageNetCore, author2 } = await loadFixture(deployWithPaperFixture);
      
      await expect(
        sageNetCore.connect(author2).updatePaperHash(
          1, 
          updatedVersion.ipfsHash, 
          updatedVersion.changeNotes
        )
      ).to.be.revertedWith("Only author can update paper");
    });
    
    it("Should prevent using an existing hash for a new version", async function () {
      const { sageNetCore, author1, author2 } = await loadFixture(deployWithPaperFixture);
      
      // Submit a second paper
      await sageNetCore.connect(author2).submitPaper(
        samplePaper2.ipfsHash,
        samplePaper2.title,
        samplePaper2.paperAbstract
      );
      
      // Try to update paper 1 with hash from paper 2
      await expect(
        sageNetCore.connect(author1).updatePaperHash(
          1, 
          samplePaper2.ipfsHash, 
          "Attempting to use existing hash"
        )
      ).to.be.revertedWith("This hash already exists for another paper");
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
    
    it("Should allow publishers to update the paper status", async function () {
      const { sageNetCore, author1, publisher } = await loadFixture(deployWithPaperFixture);
      
      // Submit to publisher
      await sageNetCore.connect(author1).submitToPublisher(1, publisher.address);
      
      // Publisher updates status
      await sageNetCore.connect(publisher).updatePaperStatus(1, 3); // Set to Published
      
      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(3);
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