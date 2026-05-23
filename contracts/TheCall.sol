// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TheCall {

    struct Call {
        uint256 id;
        address payable caller;
        string claim;
        uint256 stake;
        uint256 backerPool;
        uint256 faderPool;
        uint256 deadline;
        bool settled;
        bool callerWon;
    }

    uint256 public callCount;
    uint256 public MIN_STAKE = 0.01 ether;
    uint256 public PROTOCOL_FEE_BPS = 100;
    address public owner;
    address payable public feeRecipient;

    mapping(uint256 => Call) public calls;
    mapping(uint256 => mapping(address => uint256)) public backerStakes;
    mapping(uint256 => mapping(address => uint256)) public faderStakes;
    mapping(address => uint256) public claimable;
    mapping(address => bool) public approvedOracles;
    mapping(uint256 => uint256) public settledNetPot;
    mapping(uint256 => uint256) public settledWinnerPool;
    mapping(uint256 => bool) public settledCallerWon;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;

    event CallCreated(uint256 indexed callId, address indexed caller, string claim, uint256 stake, uint256 deadline);
    event CallBacked(uint256 indexed callId, address indexed backer, uint256 amount);
    event CallFaded(uint256 indexed callId, address indexed fader, uint256 amount);
    event CallSettled(uint256 indexed callId, bool callerWon, uint256 winnerPool, uint256 loserPool);
    event Withdrawn(address indexed user, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyOracle() {
        require(approvedOracles[msg.sender], "Not approved oracle");
        _;
    }

    constructor(address payable _feeRecipient) {
        owner = msg.sender;
        feeRecipient = _feeRecipient;
        approvedOracles[msg.sender] = true;
    }

    function addOracle(address oracle) external onlyOwner {
        approvedOracles[oracle] = true;
    }

    function removeOracle(address oracle) external onlyOwner {
        approvedOracles[oracle] = false;
    }

    function makeCall(string calldata _claim, uint256 deadline) external payable {
        require(msg.value >= MIN_STAKE, "Stake too low");
        require(deadline > block.timestamp, "Deadline must be in future");

        uint256 callId = callCount;
        callCount++;

        Call storage c = calls[callId];
        c.id = callId;
        c.caller = payable(msg.sender);
        c.claim = _claim;
        c.stake = msg.value;
        c.deadline = deadline;
        c.settled = false;

        emit CallCreated(callId, msg.sender, _claim, msg.value, deadline);
    }

    function backCall(uint256 callId) external payable {
        Call storage c = calls[callId];
        require(c.caller != address(0), "Call does not exist");
        require(!c.settled, "Already settled");
        require(block.timestamp < c.deadline, "Call expired");
        require(msg.value >= MIN_STAKE, "Stake too low");

        c.backerPool += msg.value;
        backerStakes[callId][msg.sender] += msg.value;

        emit CallBacked(callId, msg.sender, msg.value);
    }

    function fadeCall(uint256 callId) external payable {
        Call storage c = calls[callId];
        require(c.caller != address(0), "Call does not exist");
        require(!c.settled, "Already settled");
        require(block.timestamp < c.deadline, "Call expired");
        require(msg.value >= MIN_STAKE, "Stake too low");

        c.faderPool += msg.value;
        faderStakes[callId][msg.sender] += msg.value;

        emit CallFaded(callId, msg.sender, msg.value);
    }

    function settle(uint256 callId, bool _callerWon) external onlyOracle {
        Call storage c = calls[callId];
        require(c.caller != address(0), "Call does not exist");
        require(!c.settled, "Already settled");

        c.settled = true;
        c.callerWon = _callerWon;

        uint256 totalPot = c.stake + c.backerPool + c.faderPool;

        if (c.faderPool == 0 && _callerWon) {
            claimable[c.caller] += c.stake + c.backerPool;
            emit CallSettled(callId, _callerWon, c.stake + c.backerPool, 0);
            return;
        }

        if (c.backerPool == 0 && !_callerWon) {
            settledNetPot[callId] = c.faderPool + c.stake;
            settledWinnerPool[callId] = c.faderPool;
            settledCallerWon[callId] = _callerWon;
            emit CallSettled(callId, _callerWon, c.faderPool, c.stake);
            return;
        }

        uint256 fee = (totalPot * PROTOCOL_FEE_BPS) / 10000;
        uint256 netPot = totalPot - fee;

        (bool feeSent, ) = feeRecipient.call{value: fee}("");
        require(feeSent, "Fee transfer failed");

        if (_callerWon) {
            uint256 winnerBasePool = c.stake + c.backerPool;
            uint256 callerShare = (c.stake * netPot) / winnerBasePool;
            claimable[c.caller] += callerShare;
            settledNetPot[callId] = netPot;
            settledWinnerPool[callId] = winnerBasePool;
            settledCallerWon[callId] = true;
        } else {
            settledNetPot[callId] = netPot;
            settledWinnerPool[callId] = c.faderPool;
            settledCallerWon[callId] = false;
        }

        emit CallSettled(callId, _callerWon, netPot, fee);
    }

    function claim(uint256 callId) external {
        Call storage c = calls[callId];
        require(c.settled, "Not settled yet");
        require(!hasClaimed[callId][msg.sender], "Already claimed");

        hasClaimed[callId][msg.sender] = true;

        bool callerWon = settledCallerWon[callId];
        uint256 netPot = settledNetPot[callId];
        uint256 winnerPool = settledWinnerPool[callId];

        if (callerWon) {
            if (msg.sender != c.caller) {
                uint256 userStake = backerStakes[callId][msg.sender];
                require(userStake > 0, "Nothing to claim");
                uint256 payout = (userStake * netPot) / winnerPool;
                claimable[msg.sender] += payout;
            }
        } else {
            uint256 userStake = faderStakes[callId][msg.sender];
            require(userStake > 0, "Nothing to claim");
            uint256 payout = (userStake * netPot) / winnerPool;
            claimable[msg.sender] += payout;
        }

        uint256 amount = claimable[msg.sender];
        require(amount > 0, "Nothing claimable");
        claimable[msg.sender] = 0;

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    function refund(uint256 callId) external {
        Call storage c = calls[callId];
        require(c.caller != address(0), "Call does not exist");
        require(!c.settled, "Already settled");
        require(block.timestamp >= c.deadline, "Not expired yet");

        uint256 amount;

        if (msg.sender == c.caller) {
            amount = c.stake;
            require(amount > 0, "Nothing to refund");
            c.stake = 0;
        } else if (backerStakes[callId][msg.sender] > 0) {
            amount = backerStakes[callId][msg.sender];
            backerStakes[callId][msg.sender] = 0;
        } else if (faderStakes[callId][msg.sender] > 0) {
            amount = faderStakes[callId][msg.sender];
            faderStakes[callId][msg.sender] = 0;
        } else {
            revert("No stake to refund");
        }

        (bool sent, ) = payable(msg.sender).call{value: amount}("");
        require(sent, "Refund failed");
    }

    function getCall(uint256 callId) external view returns (
        address caller,
        string memory claimText,
        uint256 stake,
        uint256 backerPool,
        uint256 faderPool,
        uint256 deadline,
        bool settled,
        bool callerWon
    ) {
        Call storage c = calls[callId];
        return (
            c.caller,
            c.claim,
            c.stake,
            c.backerPool,
            c.faderPool,
            c.deadline,
            c.settled,
            c.callerWon
        );
    }

    function updateMinStake(uint256 newMin) external onlyOwner {
        MIN_STAKE = newMin;
    }

    function updateFee(uint256 newFeeBps) external onlyOwner {
        require(newFeeBps <= 500, "Max 5%");
        PROTOCOL_FEE_BPS = newFeeBps;
    }

    function updateFeeRecipient(address payable newRecipient) external onlyOwner {
        feeRecipient = newRecipient;
    }

    receive() external payable {}
}
