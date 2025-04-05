// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


/**
 * @title SageNetCore
 * @dev Core contract for the SageNet platform that handles SBTs (Soulbound Tokens) for research authorship
 * and tracking of research papers
 */
contract SageNetCore is ERC721, Ownable {
    // Simple counter for token IDs
    uint256 private _currentTokenId;

    // Status enum for research papers
    enum PaperStatus { 
        Draft,        // Initial upload
        InApplication,// Applied to publisher
        InReview,     // Under peer review
        Published     // Finalized and published
    }

    // Paper struct to store metadata
    struct Paper {
        string ipfsHash;         // IPFS hash of the paper
        address author;          // Author's address
        address publisher;       // Publisher's address (if submitted to one)
        uint256 timestamp;       // Time of submission
        PaperStatus status;      // Current status
        string title;            // Paper title
        string paperAbstract;    // Brief description
        uint256 _tokenId;         // Associated SBT ID
    }

    // Mapping from token ID to Paper
    mapping(uint256 => Paper) public papers;
    
    // Mapping from IPFS hash to token ID to prevent duplicates
    mapping(string => uint256) private _hashToTokenId;
    
    // Mapping from author address to their token IDs
    mapping(address => uint256[]) private _authorPapers;

    // Events
    event PaperSubmitted(uint256 indexed tokenId, address indexed author, string ipfsHash);
    event PaperStatusUpdated(uint256 indexed tokenId, PaperStatus newStatus);

    constructor() ERC721("SageNet Research SBT", "SAGESBT") Ownable(msg.sender) {}

    /**
     * @dev Submits a new research paper and mints an SBT to the author
     * @param ipfsHash IPFS hash of the paper
     * @param title Title of the paper
     * @param paperAbstract Brief description of the paper
     * @return tokenId The ID of the newly minted SBT
     */
    function submitPaper(
        string memory ipfsHash, 
        string memory title, 
        string memory paperAbstract
    ) public returns (uint256) {
        // Prevent duplicate submissions
        require(_hashToTokenId[ipfsHash] == 0, "Paper already exists");
        
        // Increment the token ID counter
        _currentTokenId += 1;
        console.log(_currentTokenId);
        uint256 tokenId = _currentTokenId;
        
        // Mint the SBT to the author
        _safeMint(msg.sender, tokenId);
        
        // Create and store the paper metadata
        papers[tokenId] = Paper({
            ipfsHash: ipfsHash,
            author: msg.sender,
            publisher: address(0),
            timestamp: block.timestamp,
            status: PaperStatus.Draft,
            title: title,
            paperAbstract: paperAbstract,
            _tokenId: tokenId
        });
        
        // Update mappings
        _hashToTokenId[ipfsHash] = tokenId;
        _authorPapers[msg.sender].push(tokenId);
        
        // Emit event
        emit PaperSubmitted(tokenId, msg.sender, ipfsHash);
        
        return tokenId;
    }

    /**
     * @dev Updates the status of a paper (only author, publisher, or platform)
     * @param tokenId The ID of the paper's SBT
     * @param newStatus The new status to set
     */
    function updatePaperStatus(uint256 tokenId, PaperStatus newStatus) public {
        require(exists(tokenId), "Paper does not exist");
        require(
            papers[tokenId].author == msg.sender || 
            papers[tokenId].publisher == msg.sender || 
            owner() == msg.sender,
            "Only author, publisher, or platform can update status"
        );
        
        papers[tokenId].status = newStatus;
        
        emit PaperStatusUpdated(tokenId, newStatus);
    }
    
    /**
     * @dev Submit paper to a publisher
     * @param tokenId The ID of the paper's SBT
     * @param publisher The address of the publisher
     */
    function submitToPublisher(uint256 tokenId, address publisher) public {
        require(exists(tokenId), "Paper does not exist");
        require(papers[tokenId].author == msg.sender, "Only author can submit to publisher");
        require(publisher != address(0), "Invalid publisher address");
        
        papers[tokenId].publisher = publisher;
        papers[tokenId].status = PaperStatus.InApplication;
        
        emit PaperStatusUpdated(tokenId, PaperStatus.InApplication);
    }

    /**
     * @dev Updates the IPFS hash for a paper (only author can update)
     * @param tokenId The ID of the paper's SBT
     * @param newIpfsHash The new IPFS hash
     */
    function updatePaperHash(uint256 tokenId, string memory newIpfsHash) public {
        require(exists(tokenId), "Paper does not exist");
        require(papers[tokenId].author == msg.sender, "Only author can update paper");
        
        // Remove old hash mapping
        delete _hashToTokenId[papers[tokenId].ipfsHash];
        
        // Update paper with new hash
        papers[tokenId].ipfsHash = newIpfsHash;
        
        // Add new hash mapping
        _hashToTokenId[newIpfsHash] = tokenId;
    }

    /**
     * @dev Gets all papers by an author
     * @param author The address of the author
     * @return tokenIds Array of token IDs owned by the author
     */
    function getPapersByAuthor(address author) public view returns (uint256[] memory) {
        return _authorPapers[author];
    }

    /**
     * @dev Gets paper details by token ID
     * @param tokenId The ID of the paper's SBT
     * @return Paper struct containing the paper details
     */
    function getPaper(uint256 tokenId) public view returns (Paper memory) {
        require(exists(tokenId), "Paper does not exist");
        return papers[tokenId];
    }

    /**
     * @dev Verifies if a token exists and returns its details
     * @param ipfsHash The IPFS hash to check
     * @return exists Boolean indicating if the paper exists
     * @return tokenId The ID of the paper's SBT (0 if it doesn't exist)
     */
    function verifyPaper(string memory ipfsHash) public view returns (bool, uint256) {
        uint256 tokenId = _hashToTokenId[ipfsHash];
        return (tokenId != 0, tokenId);
    }
    
    /**
     * @dev Checks if caller is publisher of a paper
     * @param tokenId The ID of the paper's SBT
     */
    function isPublisher(uint256 tokenId) public view returns (bool) {
        require(exists(tokenId), "Paper does not exist");
        return papers[tokenId].publisher == msg.sender;
    }

    /**
     * @dev Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal virtual override returns (address) {
        address from = _ownerOf(tokenId);
        
        // Only allow minting (from == 0) and burning (to == 0), no transfers
        require(from == address(0) || to == address(0), "SBT: tokens are non-transferable");
        
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Check if a token exists
     * @param tokenId The ID to check
     * @return bool True if the token exists
     */
    function exists(uint256 tokenId) public view returns (bool) {
        return tokenId > 0 && tokenId <= _currentTokenId && ownerOf(tokenId) != address(0);
    }
}