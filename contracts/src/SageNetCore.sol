// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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

    // Version struct to track paper revision history
    struct Version {
        string ipfsHash;         // IPFS hash of the paper
        uint256 timestamp;       // Time of version submission
        string changeNotes;      // Notes describing the changes in this version
    }

    // Paper struct to store metadata
    struct Paper {
        string ipfsHash;         // Current IPFS hash of the paper
        address author;          // Author's address
        address publisher;       // Publisher's address (if submitted to one)
        uint256 timestamp;       // Time of submission
        PaperStatus status;      // Current status
        string title;            // Paper title
        string paperAbstract;    // Brief description
        uint256 _tokenId;        // Associated SBT ID
        uint256 versionCount;    // Number of versions this paper has
    }

    // Mapping from token ID to Paper
    mapping(uint256 => Paper) public papers;
    
    // Mapping from IPFS hash to token ID to prevent duplicates
    mapping(string => uint256) private _hashToTokenId;
    
    // Mapping from author address to their token IDs
    mapping(address => uint256[]) private _authorPapers;
    
    // Mapping from token ID to array of historical versions
    mapping(uint256 => Version[]) private _paperVersions;
    
    // Authorized contracts that can update paper status
    mapping(address => bool) private _statusUpdaters;

    // Events
    event PaperSubmitted(uint256 indexed tokenId, address indexed author, string ipfsHash);
    event PaperStatusUpdated(uint256 indexed tokenId, PaperStatus newStatus);
    event PaperVersionAdded(uint256 indexed tokenId, string oldHash, string newHash, uint256 versionNumber);
    event StatusUpdaterSet(address indexed updater, bool authorized);

    constructor() ERC721("SageNet Research SBT", "SAGESBT") Ownable(msg.sender) {}

    /**
     * @dev Authorizes a contract to update paper statuses (for contract integration)
     * @param authorizedAddress The address to authorize
     * @param isAuthorized Whether the address should be authorized or not
     */
    function setStatusUpdater(address authorizedAddress, bool isAuthorized) public onlyOwner {
        _statusUpdaters[authorizedAddress] = isAuthorized;
        emit StatusUpdaterSet(authorizedAddress, isAuthorized);
    }

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
            _tokenId: tokenId,
            versionCount: 1
        });
        
        // Store initial version in history
        Version memory initialVersion = Version({
            ipfsHash: ipfsHash,
            timestamp: block.timestamp,
            changeNotes: "Initial submission"
        });
        
        _paperVersions[tokenId].push(initialVersion);
        
        // Update mappings
        _hashToTokenId[ipfsHash] = tokenId;
        _authorPapers[msg.sender].push(tokenId);
        
        // Emit event
        emit PaperSubmitted(tokenId, msg.sender, ipfsHash);
        
        return tokenId;
    }

    /**
     * @dev Updates the status of a paper
     * @param tokenId The ID of the paper's SBT
     * @param newStatus The new status to set
     */
    function updatePaperStatus(uint256 tokenId, PaperStatus newStatus) public {
        require(exists(tokenId), "Paper does not exist");
        
        // Only the author, the publisher, or an authorized contract can update the status
        require(
            papers[tokenId].author == msg.sender || 
            papers[tokenId].publisher == msg.sender || 
            _statusUpdaters[msg.sender],
            "Only author, publisher, or authorized contracts can update status"
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
     * @dev Updates the IPFS hash for a paper (only author can update) and tracks version history
     * @param tokenId The ID of the paper's SBT
     * @param newIpfsHash The new IPFS hash
     * @param changeNotes Notes describing the changes in this version
     */
    function updatePaperHash(uint256 tokenId, string memory newIpfsHash, string memory changeNotes) public {
        require(exists(tokenId), "Paper does not exist");
        require(papers[tokenId].author == msg.sender, "Only author can update paper");
        require(_hashToTokenId[newIpfsHash] == 0, "This hash already exists for another paper");
        
        // Store current version in history
        string memory oldHash = papers[tokenId].ipfsHash;
        uint256 newVersionNum = papers[tokenId].versionCount + 1;
        
        // Create new version record
        Version memory newVersion = Version({
            ipfsHash: newIpfsHash,
            timestamp: block.timestamp,
            changeNotes: changeNotes
        });
        
        // Add to paper version history
        _paperVersions[tokenId].push(newVersion);
        
        // Remove old hash mapping
        delete _hashToTokenId[oldHash];
        
        // Update paper with new hash and increment version count
        papers[tokenId].ipfsHash = newIpfsHash;
        papers[tokenId].versionCount = newVersionNum;
        
        // Add new hash mapping
        _hashToTokenId[newIpfsHash] = tokenId;
        
        // Emit event
        emit PaperVersionAdded(tokenId, oldHash, newIpfsHash, newVersionNum);
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
     * @dev Gets the version history of a paper
     * @param tokenId The ID of the paper's SBT
     * @return Array of Version structs representing the paper's history
     */
    function getPaperVersionHistory(uint256 tokenId) public view returns (Version[] memory) {
        require(exists(tokenId), "Paper does not exist");
        return _paperVersions[tokenId];
    }
    
    /**
     * @dev Gets a specific version of a paper
     * @param tokenId The ID of the paper's SBT
     * @param versionNumber The version number to retrieve (1-based index)
     * @return Version struct for the specified version
     */
    function getPaperVersion(uint256 tokenId, uint256 versionNumber) public view returns (Version memory) {
        require(exists(tokenId), "Paper does not exist");
        require(versionNumber > 0 && versionNumber <= papers[tokenId].versionCount, "Invalid version number");
        
        return _paperVersions[tokenId][versionNumber - 1]; // Adjust for 0-based array indexing
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
     * @param user The address against which want to check
     */
    function isPublisher(uint256 tokenId, address user) public view returns (bool) {
        require(exists(tokenId), "Paper does not exist");
        return papers[tokenId].publisher == user;
    }

    /**
     * @dev Checks if caller is author of a paper
     * @param tokenId The ID of the paper's SBT
     * @param user The address against which want to check
     */
    function isPaperAuthor(uint256 tokenId, address user) public view returns (bool) {
        require(exists(tokenId), "Paper does not exist");
        return papers[tokenId].author == user;
    }
    
    /**
     * @dev Checks if caller is author of a paper
     * @param tokenId The ID of the paper's SBT
     */
    function isAuthor(uint256 tokenId) public view returns (bool) {
        require(exists(tokenId), "Paper does not exist");
        return papers[tokenId].author == msg.sender;
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
        return tokenId > 0 && tokenId <= _currentTokenId && _ownerOf(tokenId) != address(0);
    }
}