const { Console } = require('console');

require('dotenv').config();

let Vendor = artifacts.require("Vendor");
let ERC1967Proxy = artifacts.require("ERC1967Proxy");

module.exports = async function (deployer) {
    await deployer.deploy(Vendor);
    let vendor = await Vendor.deployed();
    const data = vendor.contract.methods.initialize(process.env.SST_TOKEN, process.env.SST_AGREGATOR, process.env.ERC721_ADDRESS).encodeABI();
    console.log(`vendor.address = ${vendor.address}`);
    console.log("vendor.contract.methods.initialize");
    console.log(data);
    await deployer.deploy(ERC1967Proxy, vendor.address, data);
}