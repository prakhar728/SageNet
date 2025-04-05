import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SageNetReview - Enhanced", function () {
  // Test data
  const samplePaper = {
    ipfsHash: "QmT7fzZRBGMZCxUeU4G1q9ypuSaQRx2nAKx6SpfMYQvFeF",
    title: "Decentralized Research Publishing",
    paperAbstract: "A study on Web3-powered research platforms"
  };
  
  const sampleReview1 = {
    ipfsHash: "QmReview123456789"
  };
  
  const sampleReview2 = {
    ipfsHash: "QmReview987654321"
  };
  
  const sampleReview3 = {
    ipfsHash: "QmReviewABCDEFG"
  };

  // We define a fixture to reuse the same setup in every test
  async function deploySageNetContractsFixture() {
    // Get signers
    const [owner, author, reviewer1, reviewer2, reviewer3, publisher] = await hre.ethers.getSigners();
    
    // Deploy SageNetCore
    const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
    const sageNetCore = await SageNetCore.deploy();
    
    // Deploy SageNetReview with the core contract address
    const SageNetReview = await hre.ethers.getContractFactory("SageNetReview");
    const sageNetReview = await SageNetReview.deploy(await sageNetCore.getAddress());
    
    // Authorize the Review contract to update paper status
    await sageNetCore.connect(owner).setStatusUpdater(await sageNetReview.getAddress(), true);
    
    // Submit a paper as author
    await sageNetCore.connect(author).submitPaper(
      samplePaper.ipfsHash,
      samplePaper.title,
      samplePaper.paperAbstract
    );
    
    return { 
      sageNetCore, 
      sageNetReview, 
      owner, 
      author, 
      reviewer1, 
      reviewer2, 
      reviewer3, 
      publisher 
    };
  }

  // Fixture with multi-reviewer bounty created
  async function deployWithMultiReviewerBountyFixture() {
    const result = await loadFixture(deploySageNetContractsFixture);
    const { sageNetReview } = result;
    
    const bountyAmount = hre.ethers.parseEther("0.3"); // 0.1 ETH per reviewer
    const maxReviewers = 3; // Allow 3 reviewers
    const deadline = await time.latest() + 86400; // 1 day from now
    
    await sageNetReview.createBounty(1, deadline, maxReviewers, { value: bountyAmount });
    
    return { ...result, bountyAmount, maxReviewers, deadline };
  }

  // Fixture with reviews submitted
  async function deployWithReviewsSubmittedFixture() {
    const result = await loadFixture(deployWithMultiReviewerBountyFixture);
    const { sageNetReview, reviewer1, reviewer2, reviewer3 } = result;
    
    // Submit reviews from different reviewers
    await sageNetReview.connect(reviewer1).submitReview(1, sampleReview1.ipfsHash);
    await sageNetReview.connect(reviewer2).submitReview(1, sampleReview2.ipfsHash);
    await sageNetReview.connect(reviewer3).submitReview(1, sampleReview3.ipfsHash);
    
    return result;
  }

  // Fixture with paper submitted to publisher
  async function deployWithPublisherFixture() {
    const result = await loadFixture(deployWithReviewsSubmittedFixture);
    const { sageNetCore, author, publisher } = result;
    
    await sageNetCore.connect(author).submitToPublisher(1, publisher.address);
    
    return result;
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { sageNetReview, owner } = await loadFixture(deploySageNetContractsFixture);
      expect(await sageNetReview.owner()).to.equal(owner.address);
    });
    
    it("Should be linked to the correct core contract", async function () {
      const { sageNetReview, sageNetCore } = await loadFixture(deploySageNetContractsFixture);
      expect(await sageNetReview.sageNetCore()).to.equal(await sageNetCore.getAddress());
    });
  });

  describe("Multi-Reviewer Bounty Creation", function () {
    it("Should allow a bounty to be created with multiple reviewer slots", async function () {
      const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
      
      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = await time.latest() + 86400; // 1 day from now
      
      await sageNetReview.createBounty(1, deadline, maxReviewers, { value: bountyAmount });
      
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.paperId).to.equal(1);
      expect(bounty.amount).to.equal(bountyAmount);
      expect(bounty.deadline).to.equal(deadline);
      expect(bounty.maxReviewers).to.equal(maxReviewers);
      expect(bounty.acceptedReviews).to.equal(0);
      expect(bounty.active).to.equal(true);
    });
    
    it("Should emit a BountyCreated event with maxReviewers", async function () {
      const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
      
      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = await time.latest() + 86400; // 1 day from now
      
      await expect(sageNetReview.createBounty(1, deadline, maxReviewers, { value: bountyAmount }))
        .to.emit(sageNetReview, "BountyCreated")
        .withArgs(1, bountyAmount, deadline, maxReviewers);
    });
    
    it("Should require maxReviewers to be greater than 0", async function () {
      const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
      
      const bountyAmount = hre.ethers.parseEther("0.3");
      const deadline = await time.latest() + 86400; // 1 day from now
      
      await expect(
        sageNetReview.createBounty(1, deadline, 0, { value: bountyAmount })
      ).to.be.revertedWith("Must allow at least one reviewer");
    });
    
    it("Should require a positive bounty amount", async function () {
      const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
      
      const deadline = await time.latest() + 86400;
      const maxReviewers = 3;
      
      await expect(
        sageNetReview.createBounty(1, deadline, maxReviewers, { value: 0 })
      ).to.be.revertedWith("Bounty amount must be greater than 0");
    });
    
    it("Should require a future deadline", async function () {
      const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
      
      const bountyAmount = hre.ethers.parseEther("0.3");
      const pastDeadline = await time.latest() - 3600; // 1 hour ago
      const maxReviewers = 3;
      
      await expect(
        sageNetReview.createBounty(1, pastDeadline, maxReviewers, { value: bountyAmount })
      ).to.be.revertedWith("Deadline must be in the future");
    });
    
    it("Should not allow duplicate bounties for the same paper", async function () {
      const { sageNetReview, bountyAmount, deadline, maxReviewers } = 
        await loadFixture(deployWithMultiReviewerBountyFixture);
      
      // Try to create another bounty for the same paper
      await expect(
        sageNetReview.createBounty(1, deadline, maxReviewers, { value: bountyAmount })
      ).to.be.revertedWith("Bounty already exists for this paper");
    });
    
    it("Should provide the correct bounty status", async function () {
      const { sageNetReview, bountyAmount, maxReviewers } = 
        await loadFixture(deployWithMultiReviewerBountyFixture);
      
      const [remaining, amountPerReviewer, isActive, timeRemaining] = await sageNetReview.getBountyStatus(1);
      
      expect(remaining).to.equal(maxReviewers);
      expect(amountPerReviewer).to.equal(bountyAmount / BigInt(maxReviewers));
      expect(isActive).to.equal(true);
      expect(timeRemaining).to.be.gt(0);
    });
  });

  describe("Review Submission", function () {
    it("Should allow multiple reviewers to submit reviews", async function () {
      const { sageNetReview, reviewer1, reviewer2 } = 
        await loadFixture(deployWithMultiReviewerBountyFixture);
      
      // Submit first review
      await sageNetReview.connect(reviewer1).submitReview(1, sampleReview1.ipfsHash);
      
      // Submit second review
      await sageNetReview.connect(reviewer2).submitReview(1, sampleReview2.ipfsHash);
      
      const paperReviews = await sageNetReview.getReviewsByPaper(1);
      expect(paperReviews.length).to.equal(2);
      
      const review1 = await sageNetReview.getReview(1);
      expect(review1.reviewer).to.equal(reviewer1.address);
      expect(review1.ipfsHash).to.equal(sampleReview1.ipfsHash);
      
      const review2 = await sageNetReview.getReview(2);
      expect(review2.reviewer).to.equal(reviewer2.address);
      expect(review2.ipfsHash).to.equal(sampleReview2.ipfsHash);
    });
    
    it("Should emit a ReviewSubmitted event", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(deployWithMultiReviewerBountyFixture);
      
      await expect(sageNetReview.connect(reviewer1).submitReview(1, sampleReview1.ipfsHash))
        .to.emit(sageNetReview, "ReviewSubmitted")
        .withArgs(1, 1, reviewer1.address);
    });
    
    it("Should track reviews by reviewer", async function () {
      const { sageNetCore, sageNetReview, author, reviewer1 } = 
        await loadFixture(deployWithMultiReviewerBountyFixture);
      
      // Submit first review
      await sageNetReview.connect(reviewer1).submitReview(1, sampleReview1.ipfsHash);
      
      // Submit another paper to review
      await sageNetCore.connect(author).submitPaper(
        "QmNewPaperHash",
        "Second Paper",
        "Abstract for second paper"
      );
      
      // Create bounty for second paper
      const deadline = await time.latest() + 86400;
      await sageNetReview.createBounty(2, deadline, 3, { value: hre.ethers.parseEther("0.3") });
      
      // Submit review for second paper
      await sageNetReview.connect(reviewer1).submitReview(2, "QmSecondReviewHash");
      
      // Get reviews by reviewer
      const reviewerReviews = await sageNetReview.getReviewsByReviewer(reviewer1.address);
      expect(reviewerReviews.length).to.equal(2);
      expect(reviewerReviews[0]).to.equal(1);
      expect(reviewerReviews[1]).to.equal(2);
    });
  });

  describe("Multi-Reviewer Bounty Distribution", function () {
    it("Should distribute bounty among multiple accepted reviewers", async function () {
      const { sageNetReview, owner, reviewer1, reviewer2, bountyAmount, maxReviewers } = 
        await loadFixture(deployWithPublisherFixture);
      
      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);
      
      // Check initial balances
      const initialBalance1 = await hre.ethers.provider.getBalance(reviewer1.address);
      const initialBalance2 = await hre.ethers.provider.getBalance(reviewer2.address);
      
      // Accept first review
      await sageNetReview.connect(owner).acceptReview(1);
      
      // Accept second review
      await sageNetReview.connect(owner).acceptReview(2);
      
      // Check final balances
      const finalBalance1 = await hre.ethers.provider.getBalance(reviewer1.address);
      const finalBalance2 = await hre.ethers.provider.getBalance(reviewer2.address);
      
      // Check that reviewers received their portion of the bounty
      expect(finalBalance1 - initialBalance1).to.equal(bountyPerReviewer);
      expect(finalBalance2 - initialBalance2).to.equal(bountyPerReviewer);
      
      // Check that bounty status is updated
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.acceptedReviews).to.equal(2);
      expect(bounty.active).to.equal(true); // Still active because we have one slot left
      
      // Verify the bounty status function
      const [remaining, amountPerReviewer, isActive, timeRemaining] = await sageNetReview.getBountyStatus(1);
      expect(remaining).to.equal(1); // One slot remaining
      expect(amountPerReviewer).to.equal(bountyPerReviewer);
      expect(isActive).to.equal(true);
    });
    
    it("Should emit ReviewStatusUpdated and BountyClaimed events", async function () {
      const { sageNetReview, owner, reviewer1, bountyAmount, maxReviewers } = 
        await loadFixture(deployWithPublisherFixture);
      
      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);
      
      await expect(sageNetReview.connect(owner).acceptReview(1))
        .to.emit(sageNetReview, "ReviewStatusUpdated")
        .withArgs(1, 1) // ReviewStatus.Accepted = 1
        .and.to.emit(sageNetReview, "BountyClaimed")
        .withArgs(1, reviewer1.address, bountyPerReviewer);
    });
    
    it("Should mark bounty as inactive after max reviewers are accepted", async function () {
      const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
      
      // Accept first two reviews
      await sageNetReview.connect(owner).acceptReview(1);
      await sageNetReview.connect(owner).acceptReview(2);
      
      // Accept the third and final review
      await expect(sageNetReview.connect(owner).acceptReview(3))
        .to.emit(sageNetReview, "BountyCompleted")
        .withArgs(1);
      
      // Check that bounty is now inactive
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.acceptedReviews).to.equal(3);
      expect(bounty.active).to.equal(false);
      
      // Verify the bounty status function shows no remaining slots
      const [remaining, amountPerReviewer, isActive, timeRemaining] = await sageNetReview.getBountyStatus(1);
      expect(remaining).to.equal(0);
      expect(isActive).to.equal(false);
    });
    
    it("Should not allow accepting reviews after max is reached", async function () {
      const { sageNetReview, owner, reviewer1 } = await loadFixture(deployWithPublisherFixture);
      
      // Accept all three reviews
      await sageNetReview.connect(owner).acceptReview(1);
      await sageNetReview.connect(owner).acceptReview(2);
      await sageNetReview.connect(owner).acceptReview(3);
      
      // Submit another review
      await sageNetReview.connect(reviewer1).submitReview(1, "QmExtraReviewHash");
      
      // Try to accept a fourth review
      await expect(
        sageNetReview.connect(owner).acceptReview(4)
      ).to.be.revertedWith("Bounty is no longer active");
    });
    
    it("Should track accepted reviews separately", async function () {
      const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
      
      // Accept two reviews
      await sageNetReview.connect(owner).acceptReview(1);
      await sageNetReview.connect(owner).acceptReview(2);
      
      // Reject one review
      await sageNetReview.connect(owner).rejectReview(3);
      
      // Check accepted reviews list
      const acceptedReviews = await sageNetReview.getAcceptedReviews(1);
      expect(acceptedReviews.length).to.equal(2);
      expect(acceptedReviews[0]).to.equal(1);
      expect(acceptedReviews[1]).to.equal(2);
    });
  });

  describe("Bounty Reclamation", function () {
    it("Should allow reclaiming bounty after deadline", async function () {
      const { sageNetReview, owner, bountyAmount, maxReviewers } = 
        await loadFixture(deployWithPublisherFixture);
      
      // Accept one review (1/3 of the bounty)
      await sageNetReview.connect(owner).acceptReview(1);
      
      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);
      const expectedRemaining = bountyAmount - bountyPerReviewer;
      
      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second
      
      // Check owner's balance before reclaiming
      const initialBalance = await hre.ethers.provider.getBalance(owner.address);
      
      // Reclaim the bounty
      const tx = await sageNetReview.connect(owner).reclaimBounty(1);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? 0n;
      const gasPrice = await hre.ethers.provider.getFeeData();
      const gasCost = gasUsed * gasPrice.gasPrice;
      
      // Check owner's balance after reclaiming
      const finalBalance = await hre.ethers.provider.getBalance(owner.address);
      
      // Owner should have received the remaining 2/3 of the bounty
      expect(finalBalance - initialBalance + gasCost).to.equal(expectedRemaining);
      
      // Bounty should be marked as inactive
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.active).to.equal(false);
    });
    
    it("Should emit BountyCompleted event when reclaiming", async function () {
      const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
      
      // Accept one review
      await sageNetReview.connect(owner).acceptReview(1);
      
      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second
      
      // Reclaim the bounty
      await expect(sageNetReview.connect(owner).reclaimBounty(1))
        .to.emit(sageNetReview, "BountyCompleted")
        .withArgs(1);
    });
    
    it("Should not allow reclaiming before deadline", async function () {
      const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
      
      // Accept one review
      await sageNetReview.connect(owner).acceptReview(1);
      
      // Try to reclaim before deadline
      await expect(
        sageNetReview.connect(owner).reclaimBounty(1)
      ).to.be.revertedWith("Deadline has not passed yet");
    });
    
    it("Should not allow reclaiming already inactive bounty", async function () {
      const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
      
      // Accept all three reviews
      await sageNetReview.connect(owner).acceptReview(1);
      await sageNetReview.connect(owner).acceptReview(2);
      await sageNetReview.connect(owner).acceptReview(3);
      
      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second
      
      // Try to reclaim an inactive bounty
      await expect(
        sageNetReview.connect(owner).reclaimBounty(1)
      ).to.be.revertedWith("Bounty is no longer active");
    });
    
    it("Should not allow reclaiming non-existent bounty", async function () {
      const { sageNetReview, owner } = await loadFixture(deploySageNetContractsFixture);
      
      // Fast forward to have a future timestamp
      await time.increase(86401);
      
      // Try to reclaim a non-existent bounty
      await expect(
        sageNetReview.connect(owner).reclaimBounty(1)
      ).to.be.revertedWith("No bounty exists for this paper");
    });
  });

  describe("Publisher Review Management", function () {
    it("Should allow publishers to accept reviews", async function () {
      const { sageNetReview, publisher, reviewer1 } = await loadFixture(deployWithPublisherFixture);
      
      // Get initial balance
      const initialBalance = await hre.ethers.provider.getBalance(reviewer1.address);
      
      // Publisher accepts review
      await sageNetReview.connect(publisher).acceptReview(1);
      
      // Check reviewer received payment
      const finalBalance = await hre.ethers.provider.getBalance(reviewer1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      
      // Check review was marked as accepted
      const review = await sageNetReview.getReview(1);
      expect(review.status).to.equal(1); // Accepted
    });
    
    it("Should allow publishers to reject reviews", async function () {
      const { sageNetReview, publisher } = await loadFixture(deployWithPublisherFixture);
      
      // Publisher rejects review
      await sageNetReview.connect(publisher).rejectReview(1);
      
      // Check review was marked as rejected
      const review = await sageNetReview.getReview(1);
      expect(review.status).to.equal(2); // Rejected
    });
    
    it("Should emit ReviewStatusUpdated event when rejecting", async function () {
      const { sageNetReview, publisher } = await loadFixture(deployWithPublisherFixture);
      
      await expect(sageNetReview.connect(publisher).rejectReview(1))
        .to.emit(sageNetReview, "ReviewStatusUpdated")
        .withArgs(1, 2); // ReviewStatus.Rejected = 2
    });
    
    it("Should not allow unauthorized users to accept/reject reviews", async function () {
      const { sageNetReview, reviewer3 } = await loadFixture(deployWithPublisherFixture);
      
      // Unauthorized user tries to accept a review
      await expect(
        sageNetReview.connect(reviewer3).acceptReview(1)
      ).to.be.revertedWith("Only owner or publisher can accept reviews");
      
      // Unauthorized user tries to reject a review
      await expect(
        sageNetReview.connect(reviewer3).rejectReview(1)
      ).to.be.revertedWith("Only owner or publisher can reject reviews");
    });
  });

  describe("Core Address Update", function () {
    it("Should allow the owner to update the core address", async function () {
      const { sageNetReview, owner } = await loadFixture(deploySageNetContractsFixture);
      
      // Deploy a new core contract
      const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
      const newCore = await SageNetCore.deploy();
      
      // Update the address
      await sageNetReview.connect(owner).updateCoreAddress(await newCore.getAddress());
      
      // Check the address was updated
      expect(await sageNetReview.sageNetCore()).to.equal(await newCore.getAddress());
    });
    
    it("Should not allow non-owners to update the core address", async function () {
      const { sageNetReview, author } = await loadFixture(deploySageNetContractsFixture);
      
      // Deploy a new core contract
      const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
      const newCore = await SageNetCore.deploy();
      
      // Try to update as non-owner
      await expect(
        sageNetReview.connect(author).updateCoreAddress(await newCore.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});