/* global ethers */
/* eslint prefer-const: "off" */

const { AUTIFY_DIAMOND_ADDRESS } = require("../../contract_addresses");
const { getSelectors, FacetCutAction } = require("../libraries/diamond.js");

async function upgradeAutifyFacet() {
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
	console.log(`\tAutifyFacet deployed: ${autifyFacet.address}`);

	const selectors = getSelectors(autifyFacet).remove(["supportsInterface(bytes4)"]);
	const diamondCut = await ethers.getContractAt("IDiamondCut", AUTIFY_DIAMOND_ADDRESS);

	const functionCall = autifyFacet.interface.encodeFunctionData("__Autify_init_unchained", [
		"https://gateway.autify.com/ipfs/",
		"https://www.autify.com/contract-metadata-uri",
	]);

	const tx = await diamondCut.diamondCut(
		[
			{
				facetAddress: autifyFacet.address,
				action: FacetCutAction.Replace,
				functionSelectors: selectors,
			},
		],
		autifyFacet.address,
		functionCall
	);
	console.log("\tAutifyFacet cut tx:", tx.hash);
	const receipt = await tx.wait();
	if (!receipt.status) {
		throw Error(`AutifyFacet upgrade failed: ${tx.hash}`);
	}
	console.log("\tCompleted AutifyFacet diamond cut.\n");
}

if (require.main === module) {
	upgrade()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}

module.exports = { upgradeAutifyFacet };
