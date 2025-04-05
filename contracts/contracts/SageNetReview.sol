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
        uint256 _tokenId
    );
    function updatePaperStatus(uint256 tokenId, uint8 newStatus) external;
    function isPublisher(uint256 tokenId) external view returns (bool);
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

    // Bounty struct
    struct Bounty {
        uint256 paperId;         // Token ID of the paper
        uint256 amount;          // Amount of ETH as bounty
        uint256 deadline;        // Deadline for the review
        bool claimed;            // Whether the bounty has been claimed
    }

    // Mapping from review ID to Review
    mapping(uint256 => Review) public reviews;
    
    // Mapping from paper ID to its bounty
    mapping(uint256 => Bounty) public bounties;
    
    // Mapping from paper ID to its review IDs
    mapping(uint256 => uint256[]) private _paperReviews;
    
    // Mapping from reviewer address to their review IDs
    mapping(address => uint256[]) private _reviewerReviews;

    // Events
    event BountyCreated(uint256 indexed paperId, uint256 amount, uint256 deadline);
    event ReviewSubmitted(uint256 indexed reviewId, uint256 indexed paperId, address indexed reviewer);
    event ReviewStatusUpdated(uint256 indexed reviewId, ReviewStatus status);
    event BountyClaimed(uint256 indexed reviewId, address indexed reviewer, uint256 amount);

    modifier paperExists(uint256 paperId) {
        // This will revert if the paper doesn't exist
        sageNetCore.exists(paperId);
        _;
    }

    constructor(address _sageNetCoreAddress) Ownable(msg.sender) {
        sageNetCore = ISageNetCore(_sageNetCoreAddress);
    }

    /**
     * @dev Creates a bounty for a paper to incentivize reviews
     * @param paperId The ID of the paper
     * @param deadline The deadline for review submissions
     */
    function createBounty(uint256 paperId, uint256 deadline) public payable paperExists(paperId) {
        require(msg.value > 0, "Bounty amount must be greater than 0");
        require(deadline > block.timestamp, "Deadline must be in the future");
        require(bounties[paperId].amount == 0, "Bounty already exists for this paper");
        
        // Create the bounty
        bounties[paperId] = Bounty({
            paperId: paperId,
            amount: msg.value,
            deadline: deadline,
            claimed: false
        });
        
        emit BountyCreated(paperId, msg.value, deadline);
    }

    /**
     * @dev Submits a review for a paper
     * @param paperId The ID of the paper
     * @param ipfsHash IPFS hash of the review content
     * @return reviewId The ID of the newly created review
     */
    function submitReview(uint256 paperId, string memory ipfsHash) public paperExists(paperId) returns (uint256) {
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
     * @dev Accepts a review and pays out the bounty
     * @param reviewId The ID of the review
     */
    function acceptReview(uint256 reviewId) public {
        Review storage review = reviews[reviewId];
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
        // Check if caller is owner or publisher of the paper
        require(
            owner() == msg.sender || sageNetCore.isPublisher(review.paperId),
            "Only owner or publisher can accept reviews"
        );
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
        Bounty storage bounty = bounties[review.paperId];
        require(bounty.amount > 0, "No bounty available for this paper");
        require(!bounty.claimed, "Bounty has already been claimed");
        require(block.timestamp <= bounty.deadline, "Bounty deadline has passed");
        
        // Update review status
        review.status = ReviewStatus.Accepted;
        review.bountyAmount = bounty.amount;
        
        // Mark bounty as claimed
        bounty.claimed = true;
        
        // Update paper status to InReview
        sageNetCore.updatePaperStatus(review.paperId, 2); // 2 = InReview
        
        // Transfer bounty to reviewer
        (bool success, ) = payable(review.reviewer).call{value: bounty.amount}("");
        require(success, "Transfer failed");
        
        emit ReviewStatusUpdated(reviewId, ReviewStatus.Accepted);
        emit BountyClaimed(reviewId, review.reviewer, bounty.amount);
    }

    /**
     * @dev Rejects a review
     * @param reviewId The ID of the review
     */
    function rejectReview(uint256 reviewId) public {
        Review storage review = reviews[reviewId];
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
        // Check if caller is owner or publisher of the paper
        require(
            owner() == msg.sender || sageNetCore.isPublisher(review.paperId),
            "Only owner or publisher can reject reviews"
        );
        require(review.reviewId == reviewId, "Review does not exist");
        require(review.status == ReviewStatus.Pending, "Review is not pending");
        
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
     * @dev Updates the SageNetCore contract address (for upgrades)
     * @param _newCoreAddress The new address of the SageNetCore contract
     */
    function updateCoreAddress(address _newCoreAddress) public onlyOwner {
        sageNetCore = ISageNetCore(_newCoreAddress);
    }
}