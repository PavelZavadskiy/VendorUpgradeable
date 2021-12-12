require('dotenv').config();

let VendorV2 = artifacts.require("VendorV2");

module.exports = async function (deployer) {
    await deployer.deploy(VendorV2);
}