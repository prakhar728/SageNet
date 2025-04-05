import {
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import hre from "hardhat";

describe("SageNetReview - Author Controlled", function () {
  // Test data
  const samplePaper = {
    ipfsHash: "QmT7fzZRBGMZCxUeU4G1q9ypuSaQRx2nAKx6SpfMYQvFeF",
    title: "Decentralized Research Publishing",
    paperAbstract: "A study on Web3-powered research platforms",
  };

  const sampleReview1 = {
    ipfsHash: "QmReview123456789",
  };

  const sampleReview2 = {
    ipfsHash: "QmReview987654321",
  };

  const sampleReview3 = {
    ipfsHash: "QmReviewABCDEFG",
  };

  // Base fixture with contracts deployed
  async function deploySageNetContractsFixture() {
    // Get signers
    const [owner, author, reviewer1, reviewer2, reviewer3, publisher] =
      await hre.ethers.getSigners();

    // Deploy SageNetCore
    const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
    const sageNetCore = await SageNetCore.deploy();

    // Deploy SageNetReview with the core contract address
    const SageNetReview = await hre.ethers.getContractFactory("SageNetReview");
    const sageNetReview = await SageNetReview.deploy(
      await sageNetCore.getAddress()
    );

    // Authorize the review contract to update statuses
    await sageNetCore
      .connect(owner)
      .setStatusUpdater(await sageNetReview.getAddress(), true);

    // Submit a paper as author
    await sageNetCore
      .connect(author)
      .submitPaper(
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
      publisher,
    };
  }

  // Fixture with author-created bounty
  async function deployWithAuthorBountyFixture() {
    const result = await loadFixture(deploySageNetContractsFixture);
    const { sageNetReview, author } = result;

    const bountyAmount = hre.ethers.parseEther("0.3"); // 0.1 ETH per reviewer
    const maxReviewers = 3; // Allow 3 reviewers
    const deadline = (await time.latest()) + 86400; // 1 day from now

    await sageNetReview
      .connect(author)
      .createBounty(1, deadline, maxReviewers, { value: bountyAmount });

    return { ...result, bountyAmount, maxReviewers, deadline };
  }

  // Fixture with reviews submitted
  async function deployWithReviewsSubmittedFixture() {
    const result = await loadFixture(deployWithAuthorBountyFixture);
    const { sageNetReview, reviewer1, reviewer2, reviewer3 } = result;

    // Submit reviews from different reviewers
    await sageNetReview
      .connect(reviewer1)
      .submitReview(1, sampleReview1.ipfsHash);
    await sageNetReview
      .connect(reviewer2)
      .submitReview(1, sampleReview2.ipfsHash);
    await sageNetReview
      .connect(reviewer3)
      .submitReview(1, sampleReview3.ipfsHash);

    return result;
  }

  // Fixture with paper also submitted to publisher (in addition to having reviews)
  async function deployWithPublisherFixture() {
    const result = await loadFixture(deployWithReviewsSubmittedFixture);
    const { sageNetCore, author, publisher } = result;

    await sageNetCore.connect(author).submitToPublisher(1, publisher.address);

    return result;
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { sageNetReview, owner } = await loadFixture(
        deploySageNetContractsFixture
      );
      expect(await sageNetReview.owner()).to.equal(owner.address);
    });

    it("Should be linked to the correct core contract", async function () {
      const { sageNetReview, sageNetCore } = await loadFixture(
        deploySageNetContractsFixture
      );
      expect(await sageNetReview.sageNetCore()).to.equal(
        await sageNetCore.getAddress()
      );
    });
  });

  describe("Author Bounty Creation", function () {
    it("Should allow the author to create a bounty", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await sageNetReview
        .connect(author)
        .createBounty(1, deadline, maxReviewers, { value: bountyAmount });

      const bounty = await sageNetReview.bounties(1);
      expect(bounty.paperId).to.equal(1);
      expect(bounty.creator).to.equal(author.address);
      expect(bounty.amount).to.equal(bountyAmount);
      expect(bounty.deadline).to.equal(deadline);
      expect(bounty.maxReviewers).to.equal(maxReviewers);
      expect(bounty.acceptedReviews).to.equal(0);
      expect(bounty.active).to.equal(true);
    });

    it("Should emit a BountyCreated event with creator info", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await expect(
        sageNetReview
          .connect(author)
          .createBounty(1, deadline, maxReviewers, { value: bountyAmount })
      )
        .to.emit(sageNetReview, "BountyCreated")
        .withArgs(1, author.address, bountyAmount, deadline, maxReviewers);
    });

    it("Should update paper status to InReview automatically", async function () {
      const { sageNetCore, sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await sageNetReview
        .connect(author)
        .createBounty(1, deadline, maxReviewers, { value: bountyAmount });

      const paper = await sageNetCore.getPaper(1);
      expect(paper.status).to.equal(2); // InReview status (index 2)
    });

    it("Should not allow non-authors to create bounties", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await expect(
        sageNetReview
          .connect(reviewer1)
          .createBounty(1, deadline, maxReviewers, { value: bountyAmount })
      ).to.be.revertedWith("Only paper author can perform this action");
    });

    it("Should require a positive bounty amount", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const maxReviewers = 3;
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await expect(
        sageNetReview
          .connect(author)
          .createBounty(1, deadline, maxReviewers, { value: 0 })
      ).to.be.revertedWith("Bounty amount must be greater than 0");
    });

    it("Should require a future deadline", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const maxReviewers = 3;
      const pastDeadline = (await time.latest()) - 3600; // 1 hour ago

      await expect(
        sageNetReview
          .connect(author)
          .createBounty(1, pastDeadline, maxReviewers, { value: bountyAmount })
      ).to.be.revertedWith("Deadline must be in the future");
    });

    it("Should require at least one reviewer", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      const bountyAmount = hre.ethers.parseEther("0.3");
      const deadline = (await time.latest()) + 86400; // 1 day from now

      await expect(
        sageNetReview
          .connect(author)
          .createBounty(1, deadline, 0, { value: bountyAmount })
      ).to.be.revertedWith("Must allow at least one reviewer");
    });

    it("Should prevent duplicate bounties for the same paper", async function () {
      const { sageNetReview, author, deadline, maxReviewers } =
        await loadFixture(deployWithAuthorBountyFixture);

      // Try to create another bounty for the same paper
      await expect(
        sageNetReview
          .connect(author)
          .createBounty(1, deadline, maxReviewers, {
            value: hre.ethers.parseEther("0.1"),
          })
      ).to.be.revertedWith("Bounty already exists for this paper");
    });
  });

  describe("Bounty Status Information", function () {
    it("Should provide accurate bounty status information", async function () {
      const { sageNetReview, bountyAmount, maxReviewers } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      const [remaining, amountPerReviewer, isActive, timeRemaining] =
        await sageNetReview.getBountyStatus(1);

      expect(remaining).to.equal(maxReviewers);
      expect(amountPerReviewer).to.equal(bountyAmount / BigInt(maxReviewers));
      expect(isActive).to.equal(true);
      expect(timeRemaining).to.be.gt(0);
    });

    it("Should update status when reviews are accepted", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept one review
      await sageNetReview.connect(author).acceptReview(1);

      const [remaining, amountPerReviewer, isActive, timeRemaining] =
        await sageNetReview.getBountyStatus(1);

      expect(remaining).to.equal(2); // Should be 2 slots remaining
      expect(isActive).to.equal(true);
    });

    it("Should show inactive status after deadline passes", async function () {
      const { sageNetReview } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      const [remaining, amountPerReviewer, isActive, timeRemaining] =
        await sageNetReview.getBountyStatus(1);

      expect(isActive).to.equal(true); // Still active until reclaimed
      expect(timeRemaining).to.equal(0); // No time remaining
    });
  });

  describe("Review Submission", function () {
    it("Should allow reviewers to submit reviews", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      await sageNetReview
        .connect(reviewer1)
        .submitReview(1, sampleReview1.ipfsHash);

      const review = await sageNetReview.getReview(1);
      expect(review.paperId).to.equal(1);
      expect(review.reviewer).to.equal(reviewer1.address);
      expect(review.ipfsHash).to.equal(sampleReview1.ipfsHash);
      expect(review.status).to.equal(0); // Pending status
    });

    it("Should emit a ReviewSubmitted event", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      await expect(
        sageNetReview.connect(reviewer1).submitReview(1, sampleReview1.ipfsHash)
      )
        .to.emit(sageNetReview, "ReviewSubmitted")
        .withArgs(1, 1, reviewer1.address);
    });

    it("Should prevent authors from reviewing their own papers", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      await expect(
        sageNetReview.connect(author).submitReview(1, "QmAuthorReview")
      ).to.be.revertedWith("Author cannot review their own paper");
    });

    it("Should prevent reviews after the deadline", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      await expect(
        sageNetReview.connect(reviewer1).submitReview(1, "QmLateReview")
      ).to.be.revertedWith("Review deadline has passed");
    });

    it("Should prevent reviews when maximum is reached", async function () {
      const { sageNetReview, author, reviewer1 } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept all three reviews
      await sageNetReview.connect(author).acceptReview(1);
      await sageNetReview.connect(author).acceptReview(2);
      await sageNetReview.connect(author).acceptReview(3);

      // Try to submit one more review
      await expect(
        sageNetReview.connect(reviewer1).submitReview(1, "QmExtraReview")
      ).to.be.revertedWith("Maximum reviews already reached");
    });

    it("Should track reviews by paper", async function () {
      const { sageNetReview, reviewer1, reviewer2 } = await loadFixture(
        deployWithAuthorBountyFixture
      );

      // Submit reviews
      await sageNetReview.connect(reviewer1).submitReview(1, "QmReview1");
      await sageNetReview.connect(reviewer2).submitReview(1, "QmReview2");

      const paperReviews = await sageNetReview.getReviewsByPaper(1);
      expect(paperReviews.length).to.equal(2);
      expect(paperReviews[0]).to.equal(1);
      expect(paperReviews[1]).to.equal(2);
    });

    it("Should track reviews by reviewer", async function () {
      const { sageNetCore, sageNetReview, author, reviewer1 } =
        await loadFixture(deployWithAuthorBountyFixture);

      // Submit first review
      await sageNetReview.connect(reviewer1).submitReview(1, "QmReview1");

      // Submit another paper
      await sageNetCore
        .connect(author)
        .submitPaper(
          "QmSecondPaper",
          "Second Paper Title",
          "Second paper abstract"
        );

      // Create bounty for second paper
      await sageNetReview
        .connect(author)
        .createBounty(2, (await time.latest()) + 86400, 3, {
          value: hre.ethers.parseEther("0.3"),
        });

      // Submit review for second paper
      await sageNetReview.connect(reviewer1).submitReview(2, "QmReview2");

      // Check reviews by reviewer
      const reviewerReviews = await sageNetReview.getReviewsByReviewer(
        reviewer1.address
      );
      expect(reviewerReviews.length).to.equal(2);
      expect(reviewerReviews[0]).to.equal(1);
      expect(reviewerReviews[1]).to.equal(2);
    });
  });

  describe("Author Review Management", function () {
    it("Should allow author to accept reviews", async function () {
      const { sageNetReview, author, reviewer1, bountyAmount, maxReviewers } =
        await loadFixture(deployWithReviewsSubmittedFixture);

      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);

      // Get initial balance
      const initialBalance = await hre.ethers.provider.getBalance(
        reviewer1.address
      );

      // Author accepts the review
      await sageNetReview.connect(author).acceptReview(1);

      // Check review status
      const review = await sageNetReview.getReview(1);
      expect(review.status).to.equal(1); // Accepted
      expect(review.bountyAmount).to.equal(bountyPerReviewer);

      // Check reviewer received payment
      const finalBalance = await hre.ethers.provider.getBalance(
        reviewer1.address
      );
      expect(finalBalance - initialBalance).to.equal(bountyPerReviewer);
    });

    it("Should emit ReviewStatusUpdated and BountyClaimed events when accepting", async function () {
      const { sageNetReview, author, reviewer1, bountyAmount, maxReviewers } =
        await loadFixture(deployWithReviewsSubmittedFixture);

      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);

      await expect(sageNetReview.connect(author).acceptReview(1))
        .to.emit(sageNetReview, "ReviewStatusUpdated")
        .withArgs(1, 1) // ReviewStatus.Accepted = 1
        .and.to.emit(sageNetReview, "BountyClaimed")
        .withArgs(1, reviewer1.address, bountyPerReviewer);
    });

    it("Should allow author to reject reviews", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Author rejects the review
      await sageNetReview.connect(author).rejectReview(1);

      // Check review status
      const review = await sageNetReview.getReview(1);
      expect(review.status).to.equal(2); // Rejected
    });

    it("Should emit ReviewStatusUpdated event when rejecting", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      await expect(sageNetReview.connect(author).rejectReview(1))
        .to.emit(sageNetReview, "ReviewStatusUpdated")
        .withArgs(1, 2); // ReviewStatus.Rejected = 2
    });

    it("Should not allow non-authors to accept reviews", async function () {
      const { sageNetReview, reviewer2, publisher } = await loadFixture(
        deployWithPublisherFixture
      );

      // Publisher tries to accept
      await expect(
        sageNetReview.connect(publisher).acceptReview(1)
      ).to.be.revertedWith("Only the paper author can accept reviews");

      // Reviewer tries to accept
      await expect(
        sageNetReview.connect(reviewer2).acceptReview(1)
      ).to.be.revertedWith("Only the paper author can accept reviews");
    });

    it("Should not allow non-authors to reject reviews", async function () {
      const { sageNetReview, reviewer2, publisher } = await loadFixture(
        deployWithPublisherFixture
      );

      // Publisher tries to reject
      await expect(
        sageNetReview.connect(publisher).rejectReview(1)
      ).to.be.revertedWith("Only the paper author can reject reviews");

      // Reviewer tries to reject
      await expect(
        sageNetReview.connect(reviewer2).rejectReview(1)
      ).to.be.revertedWith("Only the paper author can reject reviews");
    });

    it("Should prevent accepting already processed reviews", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // First accept the review
      await sageNetReview.connect(author).acceptReview(1);

      // Try to accept it again
      await expect(
        sageNetReview.connect(author).acceptReview(1)
      ).to.be.revertedWith("Review is not pending");

      // First reject a review
      await sageNetReview.connect(author).rejectReview(2);

      // Try to accept it after rejection
      await expect(
        sageNetReview.connect(author).acceptReview(2)
      ).to.be.revertedWith("Review is not pending");
    });

    it("Should track accepted reviews separately", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept first review
      await sageNetReview.connect(author).acceptReview(1);

      // Reject second review
      await sageNetReview.connect(author).rejectReview(2);

      // Accept third review
      await sageNetReview.connect(author).acceptReview(3);

      // Check accepted reviews list
      const acceptedReviews = await sageNetReview.getAcceptedReviews(1);
      expect(acceptedReviews.length).to.equal(2);
      expect(acceptedReviews[0]).to.equal(1);
      expect(acceptedReviews[1]).to.equal(3);
    });
  });

  describe("Multi-Reviewer Bounty Completion", function () {
    it("Should mark bounty as inactive after all slots filled", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept all three reviews
      await sageNetReview.connect(author).acceptReview(1);
      await sageNetReview.connect(author).acceptReview(2);

      // Last acceptance should complete the bounty
      await expect(sageNetReview.connect(author).acceptReview(3))
        .to.emit(sageNetReview, "BountyCompleted")
        .withArgs(1);

      // Check bounty status
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.acceptedReviews).to.equal(3);
      expect(bounty.active).to.equal(false);

      // Check getBountyStatus
      const [remaining, amountPerReviewer, isActive, timeRemaining] =
        await sageNetReview.getBountyStatus(1);
      expect(remaining).to.equal(0);
      expect(isActive).to.equal(false);
    });

    it("Should prevent submitting reviews after max is reached", async function () {
      const { sageNetReview, author, reviewer1 } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept all three reviews
      await sageNetReview.connect(author).acceptReview(1);
      await sageNetReview.connect(author).acceptReview(2);
      await sageNetReview.connect(author).acceptReview(3);

      // Submit another review
      await expect(
        sageNetReview.connect(reviewer1).submitReview(1, "QmExtraReview")
      ).to.be.revertedWith("Maximum reviews already reached");
    });
  });

  describe("Bounty Reclamation", function () {
    it("Should allow author to reclaim remaining bounty after deadline", async function () {
      const { sageNetReview, author, bountyAmount, maxReviewers } =
        await loadFixture(deployWithReviewsSubmittedFixture);

      // Accept only one review (1/3 of the bounty)
      await sageNetReview.connect(author).acceptReview(1);

      const bountyPerReviewer = bountyAmount / BigInt(maxReviewers);
      const expectedRemaining = bountyAmount - bountyPerReviewer;

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      // Get initial balance
      const initialBalance = await hre.ethers.provider.getBalance(
        author.address
      );

      // Reclaim the bounty
      const tx = await sageNetReview.connect(author).reclaimBounty(1);
      const receipt = await tx.wait();
      const gasUsed = receipt?.gasUsed ?? 0n;
      const gasPrice = await hre.ethers.provider.getFeeData();
      const gasCost = gasUsed * gasPrice.gasPrice;

      // Get final balance
      const finalBalance = await hre.ethers.provider.getBalance(author.address);

      // Should have received the remaining amount
      expect(finalBalance - initialBalance + gasCost).to.equal(
        expectedRemaining
      );

      // Bounty should be marked as inactive
      const bounty = await sageNetReview.bounties(1);
      expect(bounty.active).to.equal(false);
    });

    it("Should emit BountyCompleted event when reclaiming", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept one review
      await sageNetReview.connect(author).acceptReview(1);

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      await expect(sageNetReview.connect(author).reclaimBounty(1))
        .to.emit(sageNetReview, "BountyCompleted")
        .withArgs(1);
    });

    it("Should prevent reclaiming before deadline", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept one review
      await sageNetReview.connect(author).acceptReview(1);

      // Try to reclaim before deadline
      await expect(
        sageNetReview.connect(author).reclaimBounty(1)
      ).to.be.revertedWith("Deadline has not passed yet");
    });

    it("Should prevent non-creators from reclaiming", async function () {
      const { sageNetReview, reviewer1 } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      // Try to reclaim as non-creator
      await expect(
        sageNetReview.connect(reviewer1).reclaimBounty(1)
      ).to.be.revertedWith("Only bounty creator can reclaim funds");
    });

    it("Should prevent reclaiming inactive bounties", async function () {
      const { sageNetReview, author } = await loadFixture(
        deployWithReviewsSubmittedFixture
      );

      // Accept all three reviews
      await sageNetReview.connect(author).acceptReview(1);
      await sageNetReview.connect(author).acceptReview(2);
      await sageNetReview.connect(author).acceptReview(3);

      // Fast forward past the deadline
      await time.increase(86401); // 1 day + 1 second

      // Try to reclaim an inactive bounty
      await expect(
        sageNetReview.connect(author).reclaimBounty(1)
      ).to.be.revertedWith("Bounty is no longer active");
    });

    it("Should prevent reclaiming non-existent bounties", async function () {
      const { sageNetCore, sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      // Submit a second paper with no bounty
      await sageNetCore
        .connect(author)
        .submitPaper(
          "QmNoBoiuntyPaper",
          "No Bounty Paper",
          "Paper without a bounty"
        );

      // Fast forward to make sure we're past any deadline
      await time.increase(86401);

      // Try to reclaim a non-existent bounty
      await expect(
        sageNetReview.connect(author).reclaimBounty(2)
      ).to.be.revertedWith("No bounty exists for this paper");
    });
  });

  describe("Contract Administration", function () {
    it("Should allow owner to update core contract address", async function () {
      const { sageNetReview, owner } = await loadFixture(
        deploySageNetContractsFixture
      );

      // Deploy a new core contract
      const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
      const newCore = await SageNetCore.deploy();

      // Update the address
      await sageNetReview
        .connect(owner)
        .updateCoreAddress(await newCore.getAddress());

      // Verify the update
      expect(await sageNetReview.sageNetCore()).to.equal(
        await newCore.getAddress()
      );
    });

    it("Should not allow non-owners to update core contract address", async function () {
      const { sageNetReview, author } = await loadFixture(
        deploySageNetContractsFixture
      );

      // Deploy a new core contract
      const SageNetCore = await hre.ethers.getContractFactory("SageNetCore");
      const newCore = await SageNetCore.deploy();

      // Non-owner tries to update the address
      await expect(
        sageNetReview
          .connect(author)
          .updateCoreAddress(await newCore.getAddress())
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
