// test/autify.test.js
// Load dependencies
const { getSelectors, FacetCutAction, removeSelectors, findAddressPositionInFacets } = require("../scripts/libraries/diamond.js");
const { deployAutifyDiamond, deployAutifyFacet, deployAutifyGettersFacet, deployAutifySettersFacet } = require("../scripts/deploy.js");
const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

// Start test block
describe("Autify Network Tests", function () {
	let diamondAddress;
	let autifyFacetAddress;
	let autifyGettersFacetAddress;
	let autifySettersFacetAddress;
	let diamondCutFacet;
	let diamondLoupeFacet;
	let ownershipFacet;
	let autifyFacet;
	let autifyGettersFacet;
	let autifySettersFacet;

	before(async function () {
		diamondAddress = await deployAutifyDiamond();
		autifyFacetAddress = await deployAutifyFacet();
		autifyGettersFacetAddress = await deployAutifyGettersFacet();
		autifySettersFacetAddress = await deployAutifySettersFacet();
		diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", diamondAddress);
		diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress);
		ownershipFacet = await ethers.getContractAt("OwnershipFacet", diamondAddress);
		autifyFacet = await ethers.getContractAt("AutifyFacet", diamondAddress);
		autifyGettersFacet = await ethers.getContractAt("AutifyGettersFacet", diamondAddress);
		autifySettersFacet = await ethers.getContractAt("AutifySettersFacet", diamondAddress);
	});

	describe("Contract Deployment and Ownership", function () {
		it("Should return contract deployer's address", async function () {
			// Test if the returned value is the same one
			// Note that we need to use strings to compare the 256 bit integers
			const [owner] = await ethers.getSigners();
			expect((await ownershipFacet.owner()).toString()).to.equal(owner.address);
			console.log("\tContract Deployer:", owner.address);
			console.log("\tDeployed Diamond Address:", diamondAddress);
			console.log("\tDeployed AutifyFacet Address:", autifyFacetAddress);
			console.log("\tDeployed AutifyGettersFacet Address:", autifyGettersFacetAddress);
		});

		it("Should have a contract name", async () => {
			const name = await autifyGettersFacet.name();
			expect(name.toString()).to.equal("Autify Network");
		});

		it("Should have a contract symbol", async () => {
			const symbol = await autifyGettersFacet.symbol();
			expect(symbol.toString()).to.equal("AUT");
		});

		it("Should not transfer ownership of the contract when called by some address other than the owner", async function () {
			const [owner, addr1, addr2] = await ethers.getSigners();
			await expect(ownershipFacet.connect(addr1).transferOwnership(addr2.address)).to.be.revertedWith("LibDiamond: Must be contract owner");
		});

		it("Should transfer ownership of the contract when called by the owner", async function () {
			const [owner, addr1] = await ethers.getSigners();
			const tx = await ownershipFacet.connect(owner).transferOwnership(addr1.address);
			await tx.wait();
			expect((await ownershipFacet.owner()).toString()).to.equal(addr1.address);
		});

		it("Should transfer back the ownership of contract when called by the new owner", async function () {
			const [owner, addr1] = await ethers.getSigners();
			const tx = await ownershipFacet.connect(addr1).transferOwnership(owner.address);
			await tx.wait();
			expect((await ownershipFacet.owner()).toString()).to.equal(owner.address);
		});
	});

	describe("Contract URI", function () {
		it("Should return correct contract metadata URI", async function () {
			expect((await autifyGettersFacet.contractURI()).toString()).to.equal("https://www.autify.com/contract-metadata-uri");
		});

		it("Should update and return the correct empty contract URI", async function () {
			await autifySettersFacet.updateContractURI("");
			expect((await autifyGettersFacet.contractURI()).toString()).to.equal("");
		});
	});
});
