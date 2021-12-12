// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

contract AgregatorEthSst {
    uint8 _decimals = 8;
    uint80 _roundId = 55340232221128654880;
    int256 _answer = 464706547924;                     
    uint256 _startedAt = 1638385687;
    uint256 _updatedAt = 1638385687;
    uint80 _answeredInRound = 55340232221128654880;
    
    function decimals() external view returns (uint8) {
        return _decimals;
    }
    
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound) {
        roundId = _roundId;
        answer = _answer;
        startedAt = _startedAt;
        updatedAt = _updatedAt;
        answeredInRound = _answeredInRound;
    }
}