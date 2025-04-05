// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

interface ISageNetCore {
    function exists(uint256 tokenId) external view returns (bool);
    function getPaper(uint256 tokenId) external view returns (
        string memory ipfsHash,
        address author,
        address publisher,
        uint256 timestamp,
        uint8 status,
        string memory title,
        string memory paperAbstract,
        uint256 _tokenId,
        uint256 versionCount
    );
    function updatePaperStatus(uint256 tokenId, uint8 newStatus) external;
    function isPublisher(uint256 tokenId) external view returns (bool);
    function isAuthor(uint256 tokenId) external view returns (bool);
}

/**
 * @title SageNetReview
 * @dev Contract for managing peer reviews and bounties in the SageNet platform
 */
contract SageNetReview is Ownable {
    // Simple counter for review IDs
    uint256 private _currentReviewId;

    // Reference to the Core contract
    ISageNetCore public sageNetCore;

    // Review status
    enum ReviewStatus {
        Pending,    // Review is submitted but not yet accepted
        Accepted,   // Review is accepted and bounty is paid
        Rejected    // Review is rejected
    }

    // Review struct
    struct Review {
        uint256 reviewId;        // Unique ID of the review
        uint256 paperId;         // Token ID of the paper being reviewed
        address reviewer;        // Address of the reviewer
        string ipfsHash;         // IPFS hash of the review content
        uint256 timestamp;       // Time of submission
        ReviewStatus status;     // Current status
        uint256 bountyAmount;    // Amount of ETH as bounty
    }

    // Enhanced Bounty struct
    struct Bounty {
        uint256 paperId;         // Token ID of the paper
        address creator;         // Address of the bounty creator (should be paper author)
        uint256 amount;          // Total amount of ETH as bounty
        uint256 deadline;        // Deadline for the review
        uint256 maxReviewers;    // Maximum number of reviewers who can receive the bounty
        uint256 acceptedReviews; // Number of reviews that have been accepted and paid
        bool active;             // Whether the bounty is still active
    }

    // Mapping from review ID to Review
    mapping(uint256 => Review) public reviews;
    
    // Mapping from paper ID to its bounty
    mapping(uint256 => Bounty) public bounties;
    
    // Mapping from paper ID to its review IDs
    mapping(uint256 => uint256[]) private _paperReviews;
    
    // Mapping from reviewer address to their review IDs
    mapping(address => uint256[]) private _reviewerReviews;
    
    // Mapping from paper ID to accepted review IDs
    mapping(uint256 => uint256[]) private _acceptedReviews;

    // Events
    event BountyCreated(uint256 indexed paperId, address indexed creator, uint256 amount, uint256 deadline, uint256 maxReviewers);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId, address indexed reviewer);
    event ReviewStatusUpdated(uint256 indexed reviewId, ReviewStatus status);
    event BountyClaimed(uint256 indexed reviewId, address indexed reviewer, uint256 amount);
    event BountyCompleted(uint256 indexed paperId);

    modifier paperExists(uint256 paperId) {
        // This will revert if the paper doesn't exist
        require(sageNetCore.exists(paperId), "Paper does not exist");
        _;
    }

    modifier onlyPaperAuthor(uint256 paperId) {
        require(sageNetCore.isAuthor(paperId), "Only paper author can perform this action");
        _;
    }

    constructor(address _sageNetCoreAddress) Ownable(msg.sender) {
        sageNetCore = ISageNetCore(_sageNetCoreAddress);
    }

    /**
     * @dev Creates a bounty for a paper to incentivize reviews - only the paper author can do this
     * @param paperId The ID of the paper
     * @param deadline The deadline for review submissions
     * @param maxReviewers Maximum number of reviewers who can receive the bounty
     */
    function createBounty(uint256 paperId, uint256 deadline, uint256 maxReviewers) 
        public 
        payable 
        paperExists(paperId)
        onlyPaperAuthor(paperId)
    {
        require(msg.value > 0, "Bounty amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(maxReviewers > 0, "Must allow at least one reviewer");
        require(bounties[paperId].amount == 0, "Bounty already exists for this paper");
        
        // Create the bounty
        bounties[paperId] = Bounty({
            paperId: paperId,
            creator: msg.sender,
            amount: msg.value,
            deadline: deadline,
            maxReviewers: maxReviewers,
            acceptedReviews: 0,
            active: true
        });
        
        // Set paper status to InReview
        sageNetCore.updatePaperStatus(paperId, 2); // 2 = InReview
        
        emit BountyCreated(paperId, msg.sender, msg.value, deadline, maxReviewers);
    }

    /**
     * @dev Submits a review for a paper
     * @param paperId The ID of the paper
     * @param ipfsHash IPFS hash of the review content
     * @return reviewId The ID of the newly created review
     */
    function submitReview(uint256 paperId, string memory ipfsHash) public paperExists(paperId) returns (uint256) {
        // Verify the paper has an active bounty
        require(bounties[paperId].active, "Paper doesn't have an active bounty for reviews");
        require(bounties[paperId].acceptedReviews < bounties[paperId].maxReviewers, "Maximum reviews already reached");
        require(block.timestamp <= bounties[paperId].deadline, "Review deadline has passed");
        
        // Make sure the reviewer is not the author
        require(!sageNetCore.isAuthor(paperId), "Author cannot review their own paper");
        
        // Increment the review ID counter
        _currentReviewId += 1;
        uint256 reviewId = _currentReviewId;
        
        // Create and store the review
        reviews[reviewId] = Review({
            reviewId: reviewId,
            paperId: paperId,
            reviewer: msg.sender,
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            status: ReviewStatus.Pending,
            bountyAmount: 0
        });
        
        // Update mappings
        _paperReviews[paperId].push(reviewId);
        _reviewerReviews[msg.sender].push(reviewId);
        
        // Emit event
        emit ReviewSubmitted(reviewId, paperId, msg.sender);
        
        return reviewId;
    }

    /**
     * @dev Accepts a review and pays out a portion of the bounty - only the paper author can do this
     * @param reviewId The ID of the review
     */
    function acceptReview(uint256 reviewId) public {
        Review storage review = reviews[reviewId];
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
        // Only the paper author can accept reviews
        require(sageNetCore.isAuthor(review.paperId), "Only the paper author can accept reviews");
        
        Bounty storage bounty = bounties[review.paperId];
        require(bounty.amount > 0, "No bounty available for this paper");
        require(bounty.active, "Bounty is no longer active");
        require(bounty.acceptedReviews < bounty.maxReviewers, "Maximum number of reviews already accepted");
        require(block.timestamp <= bounty.deadline, "Bounty deadline has passed");
        
        // Calculate the bounty amount for this reviewer
        uint256 reviewerBounty = bounty.amount / bounty.maxReviewers;
        
        // Update review status
        review.status = ReviewStatus.Accepted;
        review.bountyAmount = reviewerBounty;
        
        // Update bounty tracking
        bounty.acceptedReviews += 1;
        _acceptedReviews[review.paperId].push(reviewId);
        
        // Check if this is the last allowed review
        if (bounty.acceptedReviews >= bounty.maxReviewers) {
            bounty.active = false;
            emit BountyCompleted(review.paperId);
        }
        
        // Transfer bounty to reviewer
        (bool success, ) = payable(review.reviewer).call{value: reviewerBounty}("");
        require(success, "Transfer failed");
        
        emit ReviewStatusUpdated(reviewId, ReviewStatus.Accepted);
        emit BountyClaimed(reviewId, review.reviewer, reviewerBounty);
    }

    /**
     * @dev Rejects a review - only the paper author can do this
     * @param reviewId The ID of the review
     */
    function rejectReview(uint256 reviewId) public {
        Review storage review = reviews[reviewId];
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
        // Only the paper author can reject reviews
        require(sageNetCore.isAuthor(review.paperId), "Only the paper author can reject reviews");
        
        review.status = ReviewStatus.Rejected;
        
        emit ReviewStatusUpdated(reviewId, ReviewStatus.Rejected);
    }

    /**
     * @dev Gets all reviews for a paper
     * @param paperId The ID of the paper
     * @return reviewIds Array of review IDs for the paper
     */
    function getReviewsByPaper(uint256 paperId) public view returns (uint256[] memory) {
        return _paperReviews[paperId];
    }

    /**
     * @dev Gets all accepted reviews for a paper
     * @param paperId The ID of the paper
     * @return reviewIds Array of accepted review IDs for the paper
     */
    function getAcceptedReviews(uint256 paperId) public view returns (uint256[] memory) {
        return _acceptedReviews[paperId];
    }

    /**
     * @dev Gets all reviews by a reviewer
     * @param reviewer The address of the reviewer
     * @return reviewIds Array of review IDs by the reviewer
     */
    function getReviewsByReviewer(address reviewer) public view returns (uint256[] memory) {
        return _reviewerReviews[reviewer];
    }

    /**
     * @dev Gets review details by review ID
     * @param reviewId The ID of the review
     * @return Review struct containing the review details
     */
    function getReview(uint256 reviewId) public view returns (Review memory) {
        require(reviews[reviewId].reviewId == reviewId, "Review does not exist");
        return reviews[reviewId];
    }
    
    /**
     * @dev Returns the bounty status for a paper
     * @param paperId The ID of the paper
     * @return remaining Number of review slots remaining
     * @return amountPerReviewer Amount each reviewer receives
     * @return isActive Whether the bounty is still active
     * @return timeRemaining Time remaining until the deadline (in seconds)
     */
    function getBountyStatus(uint256 paperId) public view returns (
        uint256 remaining, 
        uint256 amountPerReviewer, 
        bool isActive, 
        uint256 timeRemaining
    ) {
        Bounty storage bounty = bounties[paperId];
        
        // If no bounty exists or it's expired
        if (bounty.amount == 0 || !bounty.active || block.timestamp > bounty.deadline) {
            return (0, 0, false, 0);
        }
        
        remaining = bounty.maxReviewers - bounty.acceptedReviews;
        amountPerReviewer = bounty.amount / bounty.maxReviewers;
        isActive = bounty.active;
        timeRemaining = bounty.deadline > block.timestamp ? bounty.deadline - block.timestamp : 0;
        
        return (remaining, amountPerReviewer, isActive, timeRemaining);
    }

    /**
     * @dev Reclaim remaining bounty after deadline has passed - only the bounty creator can do this
     * @param paperId The ID of the paper
     */
    function reclaimBounty(uint256 paperId) public {
        Bounty storage bounty = bounties[paperId];
        require(bounty.amount > 0, "No bounty exists for this paper");
        require(bounty.creator == msg.sender, "Only bounty creator can reclaim funds");
        require(block.timestamp > bounty.deadline, "Deadline has not passed yet");
        require(bounty.active, "Bounty is no longer active");
        
        // Calculate remaining bounty
        uint256 claimedAmount = bounty.acceptedReviews * (bounty.amount / bounty.maxReviewers);
        uint256 remainingAmount = bounty.amount - claimedAmount;
        
        // Mark bounty as inactive
        bounty.active = false;
        
        // Return remaining amount to the bounty creator
        (bool success, ) = payable(msg.sender).call{value: remainingAmount}("");
        require(success, "Transfer failed");
        
        emit BountyCompleted(paperId);
    }

    /**
     * @dev Updates the SageNetCore contract address (for upgrades)
     * @param _newCoreAddress The new address of the SageNetCore contract
     */
    function updateCoreAddress(address _newCoreAddress) public onlyOwner {
        sageNetCore = ISageNetCore(_newCoreAddress);
    }
}