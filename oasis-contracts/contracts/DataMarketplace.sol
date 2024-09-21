// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract DataMarketplace {
    mapping(bytes32 => bool) public registeredUsers;
    mapping(bytes32 => uint256) public userBalances;
    uint256 public constant PLATFORM_FEE = 30; // 30%

    event UserRegistered(bytes32 nullifierHash);
    event DataPurchased(bytes32 buyerNullifierHash, bytes32 sellerNullifierHash, uint256 amount);

    function registerUser(bytes32 nullifierHash) public {
        require(!registeredUsers[nullifierHash], "User already registered");
        registeredUsers[nullifierHash] = true;
        emit UserRegistered(nullifierHash);
    }

    function purchaseData(bytes32 buyerNullifierHash, bytes32 sellerNullifierHash, uint256 amount) public payable {
        require(registeredUsers[buyerNullifierHash], "Buyer not registered");
        // Removed the seller registration check
        require(msg.value >= amount, "Insufficient payment");

        uint256 sellerAmount = (amount * (100 - PLATFORM_FEE)) / 100;
        userBalances[sellerNullifierHash] += sellerAmount;

        emit DataPurchased(buyerNullifierHash, sellerNullifierHash, amount);
    }

    function getBalance(bytes32 nullifierHash) public view returns (uint256) {
        return userBalances[nullifierHash];
    }

    // Function to be called by ROFL to update processed data
    function updateProcessedData(bytes32 buyerNullifierHash, string memory processedData) public {
        emit DataProcessed(buyerNullifierHash, processedData);
    }

    event DataProcessed(bytes32 buyerNullifierHash, string processedData);
}