// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SageNetCore} from "../src/SageNetCore.sol";
import {SageNetReview} from  "../src/SageNetReview.sol";

/**
 * @title DeploySageNet
 * @dev Deploys the SageNet platform contracts using environment variables
 */
contract DeploySageNet is Script {
    function run() external {
        // Get the private key for deployment from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Get network-specific configuration
        string memory network = vm.envOr("NETWORK", string("sepolia"));
        console.log("Deploying to network:", network);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy SageNetCore first
        SageNetCore core = new SageNetCore();
        console.log("SageNetCore deployed at:", address(core));
        
        // Deploy SageNetReview, passing the SageNetCore address to the constructor
        SageNetReview review = new SageNetReview(address(core));
        console.log("SageNetReview deployed at:", address(review));
        
        // Authorize the SageNetReview contract to update paper statuses
        core.setStatusUpdater(address(review), true);
        console.log("SageNetReview authorized as status updater");
        
        // End broadcasting transactions
        vm.stopBroadcast();
        
        string memory deploymentsDir = string.concat(vm.projectRoot(), "/deployments");
        vm.createDir(deploymentsDir, true);
        
        string memory deploymentFile = string.concat(
            deploymentsDir,
            "/",
            network,
            "_addresses.txt"
        );
        
        string memory deploymentInfo = string.concat(
            "SageNetCore: ", vm.toString(address(core)), "\n",
            "SageNetReview: ", vm.toString(address(review)), "\n",
            "Deployed at: ", vm.toString(block.timestamp)
        );
        
        vm.writeFile(deploymentFile, deploymentInfo);
        console.log("Deployment info written to:", deploymentFile);
        
        // Print deployment summary
        console.log("Deployment complete!");
        console.log("SageNetCore address:", address(core));
        console.log("SageNetReview address:", address(review));
    }
}