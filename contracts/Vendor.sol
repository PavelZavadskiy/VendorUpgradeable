// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
//import "hardhat/console.sol";

interface I_Agregator{
    function decimals() external view returns (uint8);
    function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

interface I_ERC721{
    function balanceOf(address owner) external view returns (uint256);
}

interface I_ERC20{
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
}

contract Vendor is Initializable, OwnableUpgradeable, UUPSUpgradeable{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address private token;
    address private agregatorEth;
    address private tokenERC721;
    mapping (address => address) private approvedTokens;
    address[] private approvedTokensList;

    event BuyToken(address indexed _from, address indexed _to, uint256 _amount);

    function getVersion() external virtual pure returns (bytes32){
        return "V1";
    }

    function initialize(address _token, address _agregatorEth, address _tokenERC721) public initializer {
        __Ownable_init();
        token = _token;
        agregatorEth = _agregatorEth;
        tokenERC721 = _tokenERC721;
    }

    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function setApprovedToken(address _token, address _agregator) external onlyOwner{
        require(_token != address(0) && _agregator != address(0), "Wrong input values!");
        require(approvedTokens[_token] == address(0), "Token already exists!");

        approvedTokens[_token] = _agregator;
        approvedTokensList.push(_token);
    }

    function removeApprovedToken(address _token) external onlyOwner{
        require(_token != address(0), "Wrong input value!");
        require(approvedTokens[_token] != address(0), "Token isn't exists!");

        delete approvedTokens[_token];
        uint _length = approvedTokensList.length;
        for(uint256 i = 0; i < _length; i++) {
            if(approvedTokensList[i] == _token) {
                approvedTokensList[i] = approvedTokensList[_length-1];
                approvedTokensList.pop();
                break;
            }
        }
    }

    function getCountApprovedTokens() external view returns (uint256) {
        return approvedTokensList.length;
    }

    function getInfoApprovedToken(uint256 _idx) external view returns (address _adr, string memory _name, string memory _symbol) {
        require(_idx<approvedTokensList.length, "Wrong token's index!");
        address _token = approvedTokensList[_idx];
        return (_token, I_ERC20(_token).name(), I_ERC20(_token).symbol());
    }

    function getAgregatorApprovedToken(address _token) public view returns (address) {
        return approvedTokens[_token];
    }

    function getAgregatorEth() public view returns (address) {
        return agregatorEth;
    }

    function callBack(address _to, uint256 _amount, bytes memory _msg) private {
        bool sent;
        if(msg.value > 0){
            (sent, ) = payable(_to).call{value: _amount}(_msg);
        } else {
            (sent, ) = payable(_to).call(_msg);
        }
        require(sent, "Error calling the fallback function!");        
    }

    function buyToken(address _token, uint256 _amount) external payable{
        uint256 fullAmount = 0;
        if(I_ERC721(tokenERC721).balanceOf(msg.sender) == 0){
            callBack(msg.sender, msg.value, "You can't buy token! You have not ERC721 token!");
            //console.log("You can't buy token! You have not ERC721 token!");
            return;
        }

        if(msg.value > 0){    
            ( , int256 _priceSst, , , ) = I_Agregator(agregatorEth).latestRoundData();
            uint256 _decimalsSst = uint256(I_Agregator(agregatorEth).decimals());
            fullAmount += (msg.value * uint256(_priceSst)) / 10**_decimalsSst;
        }

        if(_amount != 0 && _token != address(0)){
            address _agregatorToken = approvedTokens[_token];
            if(_agregatorToken == address(0)){
                callBack(msg.sender, msg.value, "This token wasn't approved!");
                //console.log("This token wasn't approved!");
                return;
            }
            if(IERC20Upgradeable(_token).balanceOf(msg.sender) < _amount){
                callBack(msg.sender, msg.value, "You have not enough token in your balance!");
                //console.log("You have not enough token in your balance!");
                return;
            }
            if(IERC20Upgradeable(_token).allowance(msg.sender, address(this)) < _amount){
                callBack(msg.sender, msg.value, "You have not approved enough tokens!");
                //console.log("You have not approved enough tokens!");
                return;
            }
            ( , int256 _priceSst, , , ) = I_Agregator(_agregatorToken).latestRoundData();
            uint256 _decimalsSst = uint256(I_Agregator(_agregatorToken).decimals());
            fullAmount += (_amount * uint256(_priceSst)) / 10**_decimalsSst;
        }

        if(fullAmount == 0){
            callBack(msg.sender, msg.value, "Your total amount of token is zerro!");
            //console.log("Your total amount of token is zerro!");
            return;
        }

        if(fullAmount > IERC20Upgradeable(token).balanceOf(address(this))){
            callBack(msg.sender, msg.value, "Sorry, there is not enough tokens to buy!");
            //console.log("Sorry, there is not enough tokens to buy!");
            return;
        }

        if(_amount != 0 && _token != address(0)) {
            IERC20Upgradeable(_token).safeTransferFrom(msg.sender, address(this), _amount);
        }

        IERC20Upgradeable(token).safeTransfer(msg.sender, fullAmount);

        emit BuyToken(address(this), msg.sender, fullAmount);
    } 

    function claimAll() external onlyOwner {
        uint256 ethBalance = address(this).balance;
        if(ethBalance>0) {
            payable(owner()).transfer(ethBalance);
        }
        uint _length = approvedTokensList.length;
        for(uint256 i = 0; i < _length; i++) {
            address _token = approvedTokensList[i];
            uint256 _balance = IERC20Upgradeable(_token).balanceOf(address(this));
            if(_balance > 0) {
                IERC20Upgradeable(_token).safeTransfer(owner(), _balance);
            } 
        }
    }
}

contract VendorV2 is Vendor{
    function getVersion() external pure override returns (bytes32){
        return "V2";
    }

    function getExpectedTokensNumberByEth(uint256 _ethAmount) external view returns(uint256) {
        if(_ethAmount > 0)
        {
            ( , int256 _priceSst, , , ) = I_Agregator(getAgregatorEth()).latestRoundData();
            uint256 _decimalsSst = uint256(I_Agregator(getAgregatorEth()).decimals());
            return (_ethAmount * uint256(_priceSst)) / 10**_decimalsSst;
        }
        return 0;
    }  

    function getExpectedTokensNumberByToken(address _token, uint256 _amount) external view returns(uint256) {
        if(_amount != 0 && _token != address(0)){
            address _agregatorToken = getAgregatorApprovedToken(_token);
            if(_agregatorToken == address(0)){
                return 0;
            }
            ( , int256 _priceSst, , , ) = I_Agregator(_agregatorToken).latestRoundData();
            uint256 _decimalsSst = uint256(I_Agregator(_agregatorToken).decimals());
            return (_amount * uint256(_priceSst)) / 10**_decimalsSst;
        }
        else{
            return 0;
        }
    } 
}