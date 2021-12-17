const truffleAssert = require('truffle-assertions');
const { ethers, upgrades } = require("hardhat");
import { BigNumber } from 'ethers';
const { assert } = require("hardhat");
const { web3 } = require("hardhat");
const { artifacts } = require("hardhat");

const bn1e18 = BigNumber.from((10**18).toString());
const bn1e17 = BigNumber.from((10**17).toString());
const bn1e16 = BigNumber.from((10**16).toString());


describe("Vendor", () => {
    let accounts: string[];
    let owner: any;
    let payer1: any;
    let payer2: any;
    
    let vendor: any;
    let vendorV2: any;
    let sst: any;
    let dai_token: any;
    let agregator_dai_to_sst: any;
    let agregator_dai_to_sst_1: any;
    let agregator_eth_to_sst: any;
    let test721: any;
    const paymentAmount = bn1e18.mul(BigNumber.from(1));
    const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';

    let network = 'homestead';
    let provider = ethers.getDefaultProvider(network)

    beforeEach(async function () {
        [owner, payer1, payer2] = await ethers.getSigners();
        
        const Dai = await ethers.getContractFactory("Dai");
        dai_token = await Dai.deploy();
        await dai_token.deployed();

        const Sst = await ethers.getContractFactory("Sst");
        sst = await Sst.deploy();
        await sst.deployed();

        const AgregatorDaiSst = await ethers.getContractFactory("AgregatorDaiSst");
        agregator_dai_to_sst = await AgregatorDaiSst.deploy();
        await agregator_dai_to_sst.deployed();
        
        const AgregatorDaiSst_1 = await ethers.getContractFactory("AgregatorDaiSst_1");
        agregator_dai_to_sst_1 = await AgregatorDaiSst_1.deploy();
        await agregator_dai_to_sst_1.deployed();

        const AgregatorEthSst = await ethers.getContractFactory("AgregatorEthSst");
        agregator_eth_to_sst = await AgregatorEthSst.deploy();
        await agregator_eth_to_sst.deployed();

        const Test721 = await ethers.getContractFactory("Test721");
        test721 = await Test721.deploy();
        await test721.deployed();

/*        const VendorV2 = await ethers.getContractFactory("VendorV2");
        vendorV2 = await VendorV2.deploy();
        await vendorV2.deployed();*/


        const Vendor = await ethers.getContractFactory("Vendor");
        vendor = await upgrades.deployProxy(Vendor, [sst.address, agregator_eth_to_sst.address, test721.address], {kind: 'uups'});

        sst.mint(vendor.address, bn1e18.mul(BigNumber.from("1000")));
        dai_token.mint(payer1.address, bn1e18.mul(BigNumber.from("50000")));
        dai_token.mint(payer2.address, bn1e18.mul(BigNumber.from("50000")));
        test721.mint(payer1.address, BigNumber.from("1"));
    });

    describe( "setApprovedToken", function() {
        it("Should setApprovedToken successfully", async () => {
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("0").eq(count_approved_tokens_before));
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_after));
        });

        it("Should not add token. Token address is 0", async () => {
            await truffleAssert.reverts(vendor.connect(owner).setApprovedToken(NULL_ADDRESS, agregator_dai_to_sst.address), "Wrong input values!");
        });

        it("Should not add token. Agregator address is 0", async () => {
            await truffleAssert.reverts(vendor.connect(owner).setApprovedToken(dai_token.address, NULL_ADDRESS), "Wrong input values!");
        });

        it("Should not add token. Sender isn't owner", async () => {
            await truffleAssert.reverts(vendor.connect(payer1).setApprovedToken(dai_token.address, agregator_dai_to_sst.address), "Ownable: caller is not the owner");
        });

        it("Should not add token. Token already exists", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_after));
            await truffleAssert.reverts(vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address), "Token already exists!");
        });
    });

    describe( "removeApprovedToken", function() {
        it("Should removeApprovedToken successfully", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_before));
            await vendor.connect(owner).removeApprovedToken(dai_token.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("0").eq(count_approved_tokens_after));
        });

        it("Should not remove token. Sender isn't owner", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_before));
            await truffleAssert.reverts(vendor.connect(payer1).removeApprovedToken(dai_token.address), "Ownable: caller is not the owner");
        });

        it("Should not remove token. Token isn't exists", async () => {
            await truffleAssert.reverts(vendor.connect(owner).removeApprovedToken(dai_token.address), "Token isn't exists!");
        });

        it("Should not remove token. Wrong input value", async () => {
            await truffleAssert.reverts(vendor.connect(owner).removeApprovedToken(NULL_ADDRESS), "Wrong input value!");
        });
    });

    describe( "getCountApprovedTokens", function() {
        it("Should getCountApprovedTokens successfully", async () => {
            const count_approved_tokens_before = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("0").eq(count_approved_tokens_before));
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_after));
        });
    });

    describe( "getInfoApprovedToken", function() {
        it("Should getInfoApprovedToken successfully", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_after));
            const {_adr, _name, _symbol} = await vendor.getInfoApprovedToken(BigNumber.from("0"));
            assert.equal(_adr, dai_token.address);
            assert.equal(_name, "Dai Test Token");
            assert.equal(_symbol, "DAI");
        });

        it("Should be fail. Wrong token's index", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const count_approved_tokens_after = await vendor.getCountApprovedTokens();
            assert.equal(true, BigNumber.from("1").eq(count_approved_tokens_after));
            await truffleAssert.reverts(vendor.getInfoApprovedToken(BigNumber.from("3")), "Wrong token's index!");
        });
    });
    

    describe( "buyToken", function() {
        it("Should successfully. Buying sst token for ether", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const expected_amount_sst_payer = BigNumber.from("464706547924000000000");
            const amount_eth_before_owner = await ethers.provider.getBalance(owner.address);
            const result = await vendor.connect(payer1).buyToken(NULL_ADDRESS, BigNumber.from("0"), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;                
            const amount_eth_after_owner = await provider.getBalance(owner.address);
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);    
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(amount_eth_before)));
        });

        it("Should successfully. Buying sst token for dai", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const expected_amount_sst_payer = BigNumber.from("1000816750000000000");
            await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(1));
            await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(1));
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
        });

        it("Should successfully. Buying sst token for ether and dai", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const expected_amount_sst_payer = BigNumber.from("465707364674000000000");
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;  
            const result = await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1")), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed; 
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should successfully. Amount of tokens entered, no token address, ether entered", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer =  await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract =  await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const expected_amount_sst_payer = BigNumber.from("464706547924000000000");
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer1).buyToken(NULL_ADDRESS, bn1e18.mul(BigNumber.from("1")), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer =  await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract =  await ethers.provider.getBalance(vendor.address);  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should successfully. Token address entered, no amount of tokens, ether entered", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const expected_amount_sst_payer = BigNumber.from("464706547924000000000");
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer1).buyToken(dai_token.address, BigNumber.from("0"), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);  
            assert.equal(true, amount_sst_after_payer.eq(expected_amount_sst_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract.sub(expected_amount_sst_payer)));
            assert.equal(true, amount_eth_before.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve)).sub(amount_eth_before)));
        });

        it("Should be fail. You can't buy token! You have not ERC721 token! Buying sst token for ether and dai", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer2.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer2.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const resAprove = await dai_token.connect(payer2).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer2).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1")), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer2.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer2.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro! Amounts and address are not entered", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer1).buyToken(NULL_ADDRESS, BigNumber.from("0"), {value: BigNumber.from("0")});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);  
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro!! Amount of tokens entered, no token address, no ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer1).buyToken(NULL_ADDRESS, bn1e18.mul(BigNumber.from("1")), {value: BigNumber.from("0")});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address); 
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. Your total amount of token is zerro!! Token address entered, no amount of tokens, no ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("1"));
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const resAprove1 = await resAprove.wait();
            const gas_price_approve = resAprove.gasPrice;
            const used_gas_approve = resAprove1.gasUsed;
            const result = await vendor.connect(payer1).buyToken(dai_token.address, BigNumber.from("0"), {value: BigNumber.from("0")});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address); 
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price)).sub(used_gas_approve.mul(gas_price_approve))));
        });

        it("Should be fail. You do not have enough tokens in your balance", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("50001")));
            const result = await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("50001")), {value: BigNumber.from("0")});
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. This token wasn't approved", async () => {
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const resAprove = await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const result = await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1")), {value: BigNumber.from("0")});
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. You have not approved enough tokens", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            const result = await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("2")), {value: BigNumber.from("0")});
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. Sorry, there is not enough tokens to buy. No amount, no token address, ether entered", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            const amount_eth_before_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_before_contract = await ethers.provider.getBalance(vendor.address);
            const amount_eth_before = bn1e17.mul(BigNumber.from("10"));
            const result = await vendor.connect(payer1).buyToken(NULL_ADDRESS, BigNumber.from("0"), {value: amount_eth_before});
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            const amount_eth_after_payer = await ethers.provider.getBalance(payer1.address);
            const amount_eth_after_contract = await ethers.provider.getBalance(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            assert.equal(true, amount_eth_before_contract.eq(amount_eth_after_contract));
            assert.equal(true, amount_eth_after_payer.eq(amount_eth_before_payer.sub(used_gas.mul(gas_price))));
        });

        it("Should be fail. Sorry, there is not enough tokens to buy. Amount and token address entered, no ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1000")));
            const result = await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1000")), {value: BigNumber.from("0")});
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
        });

        it("Should be fail. Your total amount of token is zerro! Amount and token address entered, no ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst_1.address);
            const amount_sst_before_payer = await sst.balanceOf(payer1.address);
            const amount_sst_before_contract = await sst.balanceOf(vendor.address);
            await dai_token.connect(payer1).approve(vendor.address, BigNumber.from("1"));
            const result = await vendor.connect(payer1).buyToken(dai_token.address, BigNumber.from("1"), {value: BigNumber.from("0")});
            const amount_sst_after_payer = await sst.balanceOf(payer1.address);
            const amount_sst_after_contract = await sst.balanceOf(vendor.address);
            assert.equal(true, amount_sst_after_payer.eq(amount_sst_before_payer));
            assert.equal(true, amount_sst_after_contract.eq(amount_sst_before_contract));
            console.log();
        });
    });

     describe( "claimAll", function() {
       it("Should successfully. Claim ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            await vendor.connect(payer1).buyToken(NULL_ADDRESS, BigNumber.from("0"), {value: bn1e17.mul(BigNumber.from("1"))});
            const amount_eth_contract_before = await ethers.provider.getBalance(vendor.address);
            assert.equal(true, amount_eth_contract_before.eq(bn1e17.mul(BigNumber.from("1"))));
            const amount_eth_owner_before = await ethers.provider.getBalance(owner.address);
            const result =  await vendor.connect(owner).claimAll();
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_eth_contract_after = await ethers.provider.getBalance(vendor.address);
            const amount_eth_owner_after = await ethers.provider.getBalance(owner.address);
            assert.equal(true, amount_eth_contract_after.eq(BigNumber.from("0")));
            assert.equal(true, amount_eth_owner_after.eq(amount_eth_owner_before.add(amount_eth_contract_before).sub(used_gas.mul(gas_price))));
        });

        it("Should successfully. Claim dai and ether", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            await vendor.connect(payer1).buyToken(NULL_ADDRESS, BigNumber.from("0"), {value: bn1e17.mul(BigNumber.from("1"))});
            const amount_eth_contract_before = await ethers.provider.getBalance(vendor.address);
            assert.equal(true, amount_eth_contract_before.eq(bn1e17.mul(BigNumber.from("1"))));
            const amount_eth_owner_before = await ethers.provider.getBalance(owner.address);
            await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1")));
            const amount_dai_contract_before = await dai_token.balanceOf(vendor.address);
            assert.equal(true, amount_dai_contract_before.eq(bn1e18.mul(BigNumber.from("1"))));
            const result =  await vendor.connect(owner).claimAll();
            const result1 = await result.wait();
            const gas_price = result.gasPrice;
            const used_gas = result1.gasUsed;
            const amount_dai_contract_after = await dai_token.balanceOf(vendor.address);
            const amount_dai_owner_after = await dai_token.balanceOf(owner.address);
            assert.equal(true,amount_dai_owner_after.eq(amount_dai_contract_before));
            assert.equal(true,amount_dai_contract_after.eq(BigNumber.from("0")));
            const amount_eth_contract_after = await ethers.provider.getBalance(vendor.address);
            const amount_eth_owner_after = await ethers.provider.getBalance(owner.address);
            assert.equal(true, amount_eth_contract_after.eq(BigNumber.from("0")));
            assert.equal(true, amount_eth_owner_after.eq(amount_eth_owner_before.add(amount_eth_contract_before).sub(used_gas.mul(gas_price))));
        });

        it("Should successfully. Claim dai", async () => {
            await vendor.connect(owner).setApprovedToken(dai_token.address, agregator_dai_to_sst.address);
            await dai_token.connect(payer1).approve(vendor.address, bn1e18.mul(BigNumber.from("1")));
            await vendor.connect(payer1).buyToken(dai_token.address, bn1e18.mul(BigNumber.from("1")));
            const amount_dai_contract_before = await dai_token.balanceOf(vendor.address);
            assert.equal(true, amount_dai_contract_before.eq(bn1e18.mul(BigNumber.from("1"))));
            await vendor.connect(owner).claimAll();
            const amount_dai_contract_after = await dai_token.balanceOf(vendor.address);
            const amount_dai_owner_after = await dai_token.balanceOf(owner.address);
            assert.equal(true,amount_dai_owner_after.eq(amount_dai_contract_before));
            assert.equal(true,amount_dai_contract_after.eq(BigNumber.from("0")));
        });

        it("Should be fail. Ownable: caller is not the owner", async () => {
            await truffleAssert.reverts(vendor.connect(payer1).claimAll(), "Ownable: caller is not the owner");
        });
    });

    describe( "upgrades.upgradeProxy", function() {

        it("Should successfully. Update to V2", async () => {
            const VendorV2 = await ethers.getContractFactory("VendorV2");
            const vendorV2 = await upgrades.upgradeProxy(vendor, VendorV2);
            assert.equal("V2", await vendorV2.getVersion());
        });

        it("Should successfully. Update to V2 and back to V1", async () => {
            const VendorV2 = await ethers.getContractFactory("VendorV2");
            const vendorV2 = await upgrades.upgradeProxy(vendor, VendorV2);
            assert.equal("V2", await vendorV2.getVersion());

            const Vendor = await ethers.getContractFactory("Vendor");
            const vendorV3 = await upgrades.upgradeProxy(vendor, Vendor);
            assert.equal("V1", await vendor.getVersion());
        });

    });
});

