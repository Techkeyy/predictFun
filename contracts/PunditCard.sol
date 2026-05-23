// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract PunditCard {

    address public owner;

    struct Stats {
        uint256 wins;
        uint256 losses;
        uint256 totalStaked;
        uint256 biggestPot;
        uint256 streak;
        bool lastWon;
        bool exists;
    }

    mapping(address => Stats) public stats;
    mapping(address => bool) public approvedCallers;

    event StatUpdated(address indexed pundit, uint256 wins, uint256 losses, uint256 streak);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyCaller() {
        require(approvedCallers[msg.sender], "Not approved");
        _;
    }

    constructor() {
        owner = msg.sender;
        approvedCallers[msg.sender] = true;
    }

    function addCaller(address caller) external onlyOwner {
        approvedCallers[caller] = true;
    }

    function removeCaller(address caller) external onlyOwner {
        approvedCallers[caller] = false;
    }

    function recordResult(
        address pundit,
        bool won,
        uint256 stakeAmount,
        uint256 potSize
    ) external onlyCaller {
        Stats storage s = stats[pundit];

        if (!s.exists) {
            s.exists = true;
        }

        if (won) {
            s.wins += 1;
            if (s.lastWon) {
                s.streak += 1;
            } else {
                s.streak = 1;
            }
            s.lastWon = true;
        } else {
            s.losses += 1;
            s.streak = 0;
            s.lastWon = false;
        }

        s.totalStaked += stakeAmount;

        if (potSize > s.biggestPot) {
            s.biggestPot = potSize;
        }

        emit StatUpdated(pundit, s.wins, s.losses, s.streak);
    }

    function getStats(address pundit) external view returns (
        uint256 wins,
        uint256 losses,
        uint256 totalStaked,
        uint256 biggestPot,
        uint256 streak,
        uint256 accuracy
    ) {
        Stats storage s = stats[pundit];
        uint256 total = s.wins + s.losses;
        uint256 acc = total == 0 ? 0 : (s.wins * 100) / total;
        return (
            s.wins,
            s.losses,
            s.totalStaked,
            s.biggestPot,
            s.streak,
            acc
        );
    }

    function hasProfile(address pundit) external view returns (bool) {
        return stats[pundit].exists;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        owner = newOwner;
    }
}
