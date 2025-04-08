// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {SageNetCore} from "../src/SageNetCore.sol";
import {SageNetReview} from "../src/SageNetReview.sol";

/**
 * @title DeploySageNet
 * @dev Deploys the SageNet platform contracts using environment variables
 */
contract DeploySageNet is Script {
    function run() external {
        // Get the private key for deployment from environment
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Get network-specific configuration
        string memory network = vm.envOr("NETWORK", string("educhaintestnet"));
        console.log("Deploying to network:", network);

        vm.createSelectFork(network);
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

        // Print deployment summary
        console.log("Deployment complete!");
        console.log("SageNetCore address:", address(core));
        console.log("SageNetReview address:", address(review));
    }
}
