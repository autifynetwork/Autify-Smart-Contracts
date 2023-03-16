const { getSelectors, FacetCutAction, removeSelectors, findAddressPositionInFacets } = require("../scripts/libraries/diamond.js");
const { deployAutifyDiamond } = require("../scripts/deploy.js");
const { assert } = require("chai");

describe("AutifyDiamond Tests", async function () {
	let diamondAddress;
	let diamondCutFacet;
	let diamondLoupeFacet;
	let ownershipFacet;
	let tx;
	let receipt;
	let result;
	const facetAddresses = [];

	before(async function () {
		diamondAddress = await deployAutifyDiamond();
		diamondCutFacet = await ethers.getContractAt("DiamondCutFacet", diamondAddress);
		diamondLoupeFacet = await ethers.getContractAt("DiamondLoupeFacet", diamondAddress);
		ownershipFacet = await ethers.getContractAt("OwnershipFacet", diamondAddress);
	});

	it("should have three facets -- call to facetAddresses function", async () => {
		for (const address of await diamondLoupeFacet.facetAddresses()) {
			facetAddresses.push(address);
		}
		assert.equal(facetAddresses.length, 3);
	});

	it("facets should have the right function selectors -- call to facetFunctionSelectors function", async () => {
		let selectors = getSelectors(diamondCutFacet);
		result = await diamondLoupeFacet.facetFunctionSelectors(facetAddresses[0]);
		assert.sameMembers(result, selectors);
		selectors = getSelectors(diamondLoupeFacet);
		result = await diamondLoupeFacet.facetFunctionSelectors(facetAddresses[1]);
		assert.sameMembers(result, selectors);
		selectors = getSelectors(ownershipFacet);
		result = await diamondLoupeFacet.facetFunctionSelectors(facetAddresses[2]);
		assert.sameMembers(result, selectors);
	});

	it("selectors should be associated to facets correctly -- multiple calls to facetAddress function", async () => {
		assert.equal(facetAddresses[0], await diamondLoupeFacet.facetAddress("0x1f931c1c"));
		assert.equal(facetAddresses[1], await diamondLoupeFacet.facetAddress("0xcdffacc6"));
		assert.equal(facetAddresses[1], await diamondLoupeFacet.facetAddress("0x01ffc9a7"));
		assert.equal(facetAddresses[2], await diamondLoupeFacet.facetAddress("0xf2fde38b"));
	});

	it("should add AutifyFacet functions", async () => {
		// const LibAutify = await ethers.getContractFactory("LibAutify");
		// const libAUTIFY = await LibAutify.deploy();
		// await libAUTIFY.deployed();

		// const AutifyFacet = await ethers.getContractFactory("AutifyFacet", {
		// 	libraries: {
		// 		LibAutify: libAUTIFY.address,
		// 	},
		// });
		const AutifyFacet = await ethers.getContractFactory("AutifyFacet");
		const autifyFacet = await AutifyFacet.deploy("https://gateway.autify.com/ipfs/", "https://www.autify.com/contract-metadata-uri");
		await autifyFacet.deployed();
		facetAddresses.push(autifyFacet.address);

		const selectors = getSelectors(autifyFacet).remove(["supportsInterface(bytes4)"]);
		tx = await diamondCutFacet.diamondCut(
			[
				{
					facetAddress: autifyFacet.address,
					action: FacetCutAction.Add,
					functionSelectors: selectors,
				},
			],
			ethers.constants.AddressZero,
			"0x",
			{ gasLimit: 800000 }
		);
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}

		result = await diamondLoupeFacet.facetFunctionSelectors(autifyFacet.address);
		assert.sameMembers(result, selectors);
	});

	it("should test function call", async () => {
		const autifyFacet = await ethers.getContractAt("AutifyFacet", diamondAddress);
		await autifyFacet.pause();
	});

	it("should replace supportsInterface function", async () => {
		// const LibAutify = await ethers.getContractFactory("LibAutify");
		// const libAUTIFY = await LibAutify.deploy();
		// await libAUTIFY.deployed();

		// const AutifyFacet = await ethers.getContractFactory("AutifyFacet", {
		// 	libraries: {
		// 		LibAutify: libAUTIFY.address,
		// 	},
		// });
		const AutifyFacet = await ethers.getContractFactory("AutifyFacet");
		const selectors = getSelectors(AutifyFacet).get(["supportsInterface(bytes4)"]);
		const autifyFacetAddress = facetAddresses[3];
		tx = await diamondCutFacet.diamondCut(
			[
				{
					facetAddress: autifyFacetAddress,
					action: FacetCutAction.Replace,
					functionSelectors: selectors,
				},
			],
			ethers.constants.AddressZero,
			"0x",
			{ gasLimit: 800000 }
		);
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}
	});

	it("should add AutifyGettersFacet functions", async () => {
		const AutifyGettersFacet = await ethers.getContractFactory("AutifyGettersFacet");
		const autifyGettersFacet = await AutifyGettersFacet.deploy();
		await autifyGettersFacet.deployed();
		facetAddresses.push(autifyGettersFacet.address);
		const selectors = getSelectors(autifyGettersFacet);
		tx = await diamondCutFacet.diamondCut(
			[
				{
					facetAddress: autifyGettersFacet.address,
					action: FacetCutAction.Add,
					functionSelectors: selectors,
				},
			],
			ethers.constants.AddressZero,
			"0x",
			{ gasLimit: 800000 }
		);
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}
		result = await diamondLoupeFacet.facetFunctionSelectors(autifyGettersFacet.address);
		assert.sameMembers(result, selectors);
	});

	it("should remove some AutifyGettersFacet functions", async () => {
		const autifyGettersFacet = await ethers.getContractAt("AutifyGettersFacet", diamondAddress);
		const functionsToKeep = ["name()", "symbol()", "baseURI()"];
		const selectors = getSelectors(autifyGettersFacet).remove(functionsToKeep);
		tx = await diamondCutFacet.diamondCut(
			[
				{
					facetAddress: ethers.constants.AddressZero,
					action: FacetCutAction.Remove,
					functionSelectors: selectors,
				},
			],
			ethers.constants.AddressZero,
			"0x",
			{ gasLimit: 800000 }
		);
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}
		result = await diamondLoupeFacet.facetFunctionSelectors(facetAddresses[4]);
		assert.sameMembers(result, getSelectors(autifyGettersFacet).get(functionsToKeep));
	});

	it("should remove all functions and facets except 'diamondCut' and 'facets'", async () => {
		let selectors = [];
		let facets = await diamondLoupeFacet.facets();
		for (let i = 0; i < facets.length; i++) {
			selectors.push(...facets[i].functionSelectors);
		}
		selectors = removeSelectors(selectors, ["facets()", "diamondCut(tuple(address,uint8,bytes4[])[],address,bytes)"]);
		tx = await diamondCutFacet.diamondCut(
			[
				{
					facetAddress: ethers.constants.AddressZero,
					action: FacetCutAction.Remove,
					functionSelectors: selectors,
				},
			],
			ethers.constants.AddressZero,
			"0x",
			{ gasLimit: 800000 }
		);
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}
		facets = await diamondLoupeFacet.facets();
		assert.equal(facets.length, 2);
		assert.equal(facets[0][0], facetAddresses[0]);
		assert.sameMembers(facets[0][1], ["0x1f931c1c"]);
		assert.equal(facets[1][0], facetAddresses[1]);
		assert.sameMembers(facets[1][1], ["0x7a0ed627"]);
	});

	it("add most functions and facets", async () => {
		const diamondLoupeFacetSelectors = getSelectors(diamondLoupeFacet).remove(["supportsInterface(bytes4)"]);
		// const LibAutify = await ethers.getContractFactory("LibAutify");
		// const libAUTIFY = await LibAutify.deploy();
		// await libAUTIFY.deployed();

		// const AutifyFacet = await ethers.getContractFactory("AutifyFacet", {
		// 	libraries: {
		// 		LibAutify: libAUTIFY.address,
		// 	},
		// });
		const AutifyFacet = await ethers.getContractFactory("AutifyFacet");
		const AutifyGettersFacet = await ethers.getContractFactory("AutifyGettersFacet");
		// Any number of functions from any number of facets can be added/replaced/removed in a	single transaction
		const cut = [
			{
				facetAddress: facetAddresses[1],
				action: FacetCutAction.Add,
				functionSelectors: diamondLoupeFacetSelectors.remove(["facets()"]),
			},
			{
				facetAddress: facetAddresses[2],
				action: FacetCutAction.Add,
				functionSelectors: getSelectors(ownershipFacet),
			},
			{
				facetAddress: facetAddresses[3],
				action: FacetCutAction.Add,
				functionSelectors: getSelectors(AutifyFacet),
			},
			{
				facetAddress: facetAddresses[4],
				action: FacetCutAction.Add,
				functionSelectors: getSelectors(AutifyGettersFacet),
			},
		];
		tx = await diamondCutFacet.diamondCut(cut, ethers.constants.AddressZero, "0x", { gasLimit: 8000000 });
		receipt = await tx.wait();
		if (!receipt.status) {
			throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
		}
		const facets = await diamondLoupeFacet.facets();
		const _facetAddresses = await diamondLoupeFacet.facetAddresses();
		assert.equal(_facetAddresses.length, 5);
		assert.equal(facets.length, 5);
		assert.sameMembers(_facetAddresses, facetAddresses);
		assert.equal(facets[0][0], facetAddresses[0], "first facet");
		assert.equal(facets[1][0], facetAddresses[1], "second facet");
		assert.equal(facets[2][0], facetAddresses[2], "third facet");
		assert.equal(facets[3][0], facetAddresses[3], "fourth facet");
		assert.equal(facets[4][0], facetAddresses[4], "fifth facet");
		assert.sameMembers(facets[findAddressPositionInFacets(facetAddresses[0], facets)][1], getSelectors(diamondCutFacet));
		assert.sameMembers(facets[findAddressPositionInFacets(facetAddresses[1], facets)][1], diamondLoupeFacetSelectors);
		assert.sameMembers(facets[findAddressPositionInFacets(facetAddresses[2], facets)][1], getSelectors(ownershipFacet));
		assert.sameMembers(facets[findAddressPositionInFacets(facetAddresses[3], facets)][1], getSelectors(AutifyFacet));
		assert.sameMembers(facets[findAddressPositionInFacets(facetAddresses[4], facets)][1], getSelectors(AutifyGettersFacet));
	});
});
