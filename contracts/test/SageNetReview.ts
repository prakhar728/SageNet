import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
  import { expect } from "chai";
  import hre from "hardhat";
  
  describe("SageNetReview", function () {
    // Test data
    const samplePaper = {
      ipfsHash: "QmT7fzZRBGMZCxUeU4G1q9ypuSaQRx2nAKx6SpfMYQvFeF",
      title: "Decentralized Research Publishing",
      paperAbstract: "A study on Web3-powered research platforms"
    };
    
    const sampleReview = {
      ipfsHash: "QmReview123456789"
    };
  
    // We define a fixture to reuse the same setup in every test
    async function deploySageNetContractsFixture() {
      // Get signers
      const [owner, author, reviewer1, reviewer2, publisher] = await hre.ethers.getSigners();
      
      // Deploy SageNetCore
      const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
      const sageNetCore = await SageNetCore.deploy();
      
      // Deploy SageNetReview with the core contract address
      const SageNetReview = await hre.ethers.getContractFactory("SageNetReview");
      console.log(await sageNetCore.getAddress());
      
      const sageNetReview = await SageNetReview.deploy(await sageNetCore.getAddress());
      
      // Submit a paper as author
      await sageNetCore.connect(author).submitPaper(
        samplePaper.ipfsHash,
        samplePaper.title,
        samplePaper.paperAbstract
      );
      
      return { sageNetCore, sageNetReview, owner, author, reviewer1, reviewer2, publisher };
    }
  
    // Fixture with bounty created
    async function deployWithBountyFixture() {
      const result = await loadFixture(deploySageNetContractsFixture);
      const { sageNetReview } = result;
      
      const bountyAmount = hre.ethers.parseEther("0.1");
      const deadline = await time.latest() + 86400; // 1 day from now
      
      await sageNetReview.createBounty(1, deadline, { value: bountyAmount });
      
      return { ...result, bountyAmount, deadline };
    }
  
    // Fixture with review submitted
    async function deployWithReviewFixture() {
      const result = await loadFixture(deployWithBountyFixture);
      const { sageNetReview, reviewer1 } = result;
      
      await sageNetReview.connect(reviewer1).submitReview(1, sampleReview.ipfsHash);
      
      return result;
    }
  
    // Fixture with paper submitted to publisher
    async function deployWithPublisherFixture() {
      const result = await loadFixture(deployWithReviewFixture);
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
  
    describe("Bounty Creation", function () {
      it("Should allow a bounty to be created", async function () {
        const { sageNetReview, sageNetCore } = await loadFixture(deploySageNetContractsFixture);
        
        const bountyAmount = hre.ethers.parseEther("0.1");
        const deadline = await time.latest() + 86400; // 1 day from now
        
        await sageNetReview.createBounty(1, deadline, { value: bountyAmount });
        
        const bounty = await sageNetReview.bounties(1);
        expect(bounty.paperId).to.equal(1);
        expect(bounty.amount).to.equal(bountyAmount);
        expect(bounty.deadline).to.equal(deadline);
        expect(bounty.claimed).to.equal(false);
      });
      
      it("Should emit a BountyCreated event", async function () {
        const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
        
        const bountyAmount = hre.ethers.parseEther("0.1");
        const deadline = await time.latest() + 86400; // 1 day from now
        
        await expect(sageNetReview.createBounty(1, deadline, { value: bountyAmount }))
          .to.emit(sageNetReview, "BountyCreated")
          .withArgs(1, bountyAmount, deadline);
      });
      
      it("Should require a positive bounty amount", async function () {
        const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
        
        const deadline = await time.latest() + 86400;
        
        await expect(
          sageNetReview.createBounty(1, deadline, { value: 0 })
        ).to.be.revertedWith("Bounty amount must be greater than 0");
      });
      
      it("Should require a future deadline", async function () {
        const { sageNetReview } = await loadFixture(deploySageNetContractsFixture);
        
        const bountyAmount = hre.ethers.parseEther("0.1");
        const pastDeadline = await time.latest() - 3600; // 1 hour ago
        
        await expect(
          sageNetReview.createBounty(1, pastDeadline, { value: bountyAmount })
        ).to.be.revertedWith("Deadline must be in the future");
      });
      
      it("Should not allow duplicate bounties for the same paper", async function () {
        const { sageNetReview, bountyAmount, deadline } = await loadFixture(deployWithBountyFixture);
        
        // Try to create another bounty for the same paper
        await expect(
          sageNetReview.createBounty(1, deadline, { value: bountyAmount })
        ).to.be.revertedWith("Bounty already exists for this paper");
      });
    });
  
    describe("Review Submission", function () {
      it("Should allow a reviewer to submit a review", async function () {
        const { sageNetReview, reviewer1 } = await loadFixture(deployWithBountyFixture);
        
        await sageNetReview.connect(reviewer1).submitReview(1, sampleReview.ipfsHash);
        
        const reviewId = 1; // First review should have ID 1
        const review = await sageNetReview.getReview(reviewId);
        
        expect(review.reviewId).to.equal(reviewId);
        expect(review.paperId).to.equal(1);
        expect(review.reviewer).to.equal(reviewer1.address);
        expect(review.ipfsHash).to.equal(sampleReview.ipfsHash);
        expect(review.status).to.equal(0); // Pending status
      });
      
      it("Should emit a ReviewSubmitted event", async function () {
        const { sageNetReview, reviewer1 } = await loadFixture(deployWithBountyFixture);
        
        await expect(sageNetReview.connect(reviewer1).submitReview(1, sampleReview.ipfsHash))
          .to.emit(sageNetReview, "ReviewSubmitted")
          .withArgs(1, 1, reviewer1.address);
      });
      
      it("Should track reviews by paper", async function () {
        const { sageNetReview, reviewer1, reviewer2 } = await loadFixture(deployWithBountyFixture);
        
        // Submit two reviews for the same paper
        await sageNetReview.connect(reviewer1).submitReview(1, "QmReview1");
        await sageNetReview.connect(reviewer2).submitReview(1, "QmReview2");
        
        const paperReviews = await sageNetReview.getReviewsByPaper(1);
        expect(paperReviews.length).to.equal(2);
        expect(paperReviews[0]).to.equal(1);
        expect(paperReviews[1]).to.equal(2);
      });
      
      it("Should track reviews by reviewer", async function () {
        const { sageNetCore, sageNetReview, author, reviewer1 } = await loadFixture(deployWithBountyFixture);
        
        // Submit first review
        await sageNetReview.connect(reviewer1).submitReview(1, "QmReview1");
        
        // Submit another paper to review
        await sageNetCore.connect(author).submitPaper(
          "QmNewPaper",
          "Paper 2",
          "Abstract for paper 2"
        );
        
        // Set up bounty for the second paper
        const deadline = await time.latest() + 86400;
        await sageNetReview.createBounty(2, deadline, { value: hre.ethers.parseEther("0.1") });
        
        // Submit second review
        await sageNetReview.connect(reviewer1).submitReview(2, "QmReview2");
        
        const reviewerReviews = await sageNetReview.getReviewsByReviewer(reviewer1.address);
        expect(reviewerReviews.length).to.equal(2);
        expect(reviewerReviews[0]).to.equal(1);
        expect(reviewerReviews[1]).to.equal(2);
      });
    });
  
    describe("Review Management", function () {
      it("Should allow the owner to accept a review", async function () {
        const { sageNetReview, reviewer1 } = await loadFixture(deployWithPublisherFixture);
        
        const initialBalance = await hre.ethers.provider.getBalance(reviewer1.address);
        
        // Accept the review
        await sageNetReview.connect(reviewer1).acceptReview(1);
        
        // Check review status
        const review = await sageNetReview.getReview(1);
        expect(review.status).to.equal(1); // Accepted
        
        // Check bounty is claimed
        const bounty = await sageNetReview.bounties(1);
        expect(bounty.claimed).to.equal(true);
      });
      
      it("Should emit a ReviewStatusUpdated event", async function () {
        const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
        
        await expect(sageNetReview.connect(owner).acceptReview(1))
          .to.emit(sageNetReview, "ReviewStatusUpdated")
          .withArgs(1, 1); // 1 = Accepted
      });
      
      it("Should emit a BountyClaimed event", async function () {
        const { sageNetReview, owner, reviewer1, bountyAmount } = await loadFixture(deployWithPublisherFixture);
        
        await expect(sageNetReview.connect(owner).acceptReview(1))
          .to.emit(sageNetReview, "BountyClaimed")
          .withArgs(1, reviewer1.address, bountyAmount);
      });
      
      it("Should allow the publisher to accept a review", async function () {
        const { sageNetReview, publisher } = await loadFixture(deployWithPublisherFixture);
        
        // Accept the review as publisher
        await sageNetReview.connect(publisher).acceptReview(1);
        
        // Check review status
        const review = await sageNetReview.getReview(1);
        expect(review.status).to.equal(1); // Accepted
      });
      
      it("Should not allow non-owners or non-publishers to accept reviews", async function () {
        const { sageNetReview, reviewer2 } = await loadFixture(deployWithPublisherFixture);
        
        // Try to accept as random reviewer
        await expect(
          sageNetReview.connect(reviewer2).acceptReview(1)
        ).to.be.revertedWith("Only owner or publisher can accept reviews");
      });
      
      it("Should allow the owner to reject a review", async function () {
        const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
        
        // Reject the review
        await sageNetReview.connect(owner).rejectReview(1);
        
        // Check review status
        const review = await sageNetReview.getReview(1);
        expect(review.status).to.equal(2); // Rejected
      });
      
      it("Should emit a ReviewStatusUpdated event when rejecting", async function () {
        const { sageNetReview, owner } = await loadFixture(deployWithPublisherFixture);
        
        await expect(sageNetReview.connect(owner).rejectReview(1))
          .to.emit(sageNetReview, "ReviewStatusUpdated")
          .withArgs(1, 2); // 2 = Rejected
      });
      
      it("Should allow the publisher to reject a review", async function () {
        const { sageNetReview, publisher } = await loadFixture(deployWithPublisherFixture);
        
        // Reject the review as publisher
        await sageNetReview.connect(publisher).rejectReview(1);
        
        // Check review status
        const review = await sageNetReview.getReview(1);
        expect(review.status).to.equal(2); // Rejected
      });
      
      it("Should not allow non-owners or non-publishers to reject reviews", async function () {
        const { sageNetReview, reviewer2 } = await loadFixture(deployWithPublisherFixture);
        
        // Try to reject as random reviewer
        await expect(
          sageNetReview.connect(reviewer2).rejectReview(1)
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