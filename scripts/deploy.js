/* global ethers */
/* eslint prefer-const: "off" */

const fs = require("fs/promises");
const { getSelectors, FacetCutAction } = require("./libraries/diamond.js");
let autifyDiamondAddress;
var diamondAddressWriteToFile;
var diamondAddressWriteToFileData;

async function deployAutifyDiamond() {
	const accounts = await ethers.getSigners();
	const contractOwner = accounts[0];

	// deploy DiamondCutFacet
	const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
	const diamondCutFacet = await DiamondCutFacet.deploy();
	await diamondCutFacet.deployed();
	console.log("\n\tDiamondCutFacet deployed:", diamondCutFacet.address);

	// deploy DiamondLoupeFacet
	const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
	const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
	await diamondLoupeFacet.deployed();
	console.log("\tDiamondLoupeFacet deployed:", diamondLoupeFacet.address);

	// deploy AutifyDiamond
	const AutifyDiamond = await ethers.getContractFactory("AutifyDiamond");
	const diamond = await AutifyDiamond.deploy(contractOwner.address, diamondCutFacet.address, diamondLoupeFacet.address);
	await diamond.deployed();
	console.log("\n\tAutifyDiamond deployed:", diamond.address);
	autifyDiamondAddress = diamond.address;

	// deploy DiamondInit
	// DiamondInit provides a function that is called when the diamond is upgraded to initialize state variables
	// Read about how the diamondCut function works here: https://eips.ethereum.org/EIPS/eip-2535#addingreplacingremoving-functions
	const DiamondInit = await ethers.getContractFactory("DiamondInit");
	const diamondInit = await DiamondInit.deploy();
	await diamondInit.deployed();
	console.log("\tDiamondInit deployed:", diamondInit.address);

	console.log("\tWriting Diamond addresses to file- contract_addresses.js\n");
	diamondAddressWriteToFile = `const AUTIFY_DIAMONDCUT_FACET = "${diamondCutFacet.address}";\nconst AUTIFY_DIAMONDLOUPE_FACET = "${diamondLoupeFacet.address}";\nconst AUTIFY_DIAMOND_ADDRESS = "${diamond.address}";\n`;
	diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
	await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), (err) => {
		if (err) {
			console.log("Error writing config.js:", err.message);
		}
	});

	// deploy facets
	console.log("\n\tDeploying facets...\n");
	const FacetNames = ["OwnershipFacet"];
	const cut = [];
	for (const FacetName of FacetNames) {
		const Facet = await ethers.getContractFactory(FacetName);
		const facet = await Facet.deploy();
		await facet.deployed();
		console.log(`\t${FacetName} deployed: ${facet.address}`);
		diamondAddressWriteToFile = `const AUTIFY_OWNERSHIP_FACET = "${facet.address}";\n`;
		diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
		await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), { flag: "a+" }, (err) => {
			if (err) {
				console.log("Error writing config.js:", err.message);
			}
		});
		cut.push({
			facetAddress: facet.address,
			action: FacetCutAction.Add,
			functionSelectors: getSelectors(facet),
		});
	}

	// add remaining diamondLoupeFacet functions to the diamond
	const selectors = getSelectors(diamondLoupeFacet).remove(["supportsInterface(bytes4)"]);
	cut.push({
		facetAddress: diamondLoupeFacet.address,
		action: FacetCutAction.Add,
		functionSelectors: selectors,
	});

	// upgrade diamond with facets
	// console.log("AutifyDiamond Cut:", cut);
	const diamondCut = await ethers.getContractAt("IDiamondCut", diamond.address);
	let tx;
	let receipt;
	// call to init function
	let functionCall = diamondInit.interface.encodeFunctionData("init");
	tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall);
	console.log("\tAutifyDiamond cut tx:", tx.hash);
	receipt = await tx.wait();
	if (!receipt.status) {
		throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
	}
	console.log("\tCompleted diamond cut.\n");

	return diamond.address;
}

async function deployAutifyFacet() {
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
	diamondAddressWriteToFile = `const AUTIFY_FACET_ADDRESS = "${autifyFacet.address}";\n`;
	diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
	await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), { flag: "a+" }, (err) => {
		if (err) {
			console.log("Error writing config.js:", err.message);
		}
	});

	const selectors = getSelectors(autifyFacet).remove(["supportsInterface(bytes4)"]);

	const diamondCut = await ethers.getContractAt("IDiamondCut", autifyDiamondAddress);
	const functionCall = autifyFacet.interface.encodeFunctionData("__Autify_init_unchained", [
		"https://gateway.autify.com/ipfs/",
		"https://www.autify.com/contract-metadata-uri",
	]);
	const tx = await diamondCut.diamondCut(
		[
			{
				facetAddress: autifyFacet.address,
				action: FacetCutAction.Add,
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
	return autifyFacet.address;
}

async function deployAutifyGettersFacet() {
	const AutifyGettersFacet = await ethers.getContractFactory("AutifyGettersFacet");
	const autifyGettersFacet = await AutifyGettersFacet.deploy();
	await autifyGettersFacet.deployed();
	console.log(`\tAutifyGettersFacet deployed: ${autifyGettersFacet.address}`);
	diamondAddressWriteToFile = `const AUTIFY_GETTERS_FACET = "${autifyGettersFacet.address}";\n`;
	diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
	await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), { flag: "a+" }, (err) => {
		if (err) {
			console.log("Error writing config.js:", err.message);
		}
	});

	const selectors = getSelectors(autifyGettersFacet);
	const diamondCut = await ethers.getContractAt("IDiamondCut", autifyDiamondAddress);
	const tx = await diamondCut.diamondCut(
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
	console.log("\tAutifyGettersFacet cut tx:", tx.hash);
	const receipt = await tx.wait();
	if (!receipt.status) {
		throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
	}
	console.log("\tCompleted AutifyGettersFacet diamond cut.\n");
	return autifyGettersFacet.address;
}

async function deployAutifySettersFacet() {
	const AutifySettersFacet = await ethers.getContractFactory("AutifySettersFacet");
	const autifySettersFacet = await AutifySettersFacet.deploy();
	await autifySettersFacet.deployed();
	console.log(`\tAutifySettersFacet deployed: ${autifySettersFacet.address}`);
	diamondAddressWriteToFile = `const AUTIFY_SETTERS_FACET = "${autifySettersFacet.address}";\n`;
	diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
	await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), { flag: "a+" }, (err) => {
		if (err) {
			console.log("Error writing config.js:", err.message);
		}
	});

	const selectors = getSelectors(autifySettersFacet).remove(["supportsInterface(bytes4)"]);
	const diamondCut = await ethers.getContractAt("IDiamondCut", autifyDiamondAddress);
	const tx = await diamondCut.diamondCut(
		[
			{
				facetAddress: autifySettersFacet.address,
				action: FacetCutAction.Add,
				functionSelectors: selectors,
			},
		],
		ethers.constants.AddressZero,
		"0x",
		{ gasLimit: 800000 }
	);
	console.log("\tAutifySettersFacet cut tx:", tx.hash);
	const receipt = await tx.wait();
	if (!receipt.status) {
		throw Error(`AutifyDiamond upgrade failed: ${tx.hash}`);
	}
	console.log("\tCompleted AutifySettersFacet diamond cut.\n");
	return autifySettersFacet.address;
}

async function appendExportsLine() {
	diamondAddressWriteToFile = `\nmodule.exports = {
	AUTIFY_DIAMONDCUT_FACET,
	AUTIFY_DIAMONDLOUPE_FACET,
	AUTIFY_DIAMOND_ADDRESS,
	AUTIFY_OWNERSHIP_FACET,
	AUTIFY_FACET_ADDRESS,
	AUTIFY_GETTERS_FACET,
	AUTIFY_SETTERS_FACET,
};`;
	diamondAddressWriteToFileData = JSON.stringify(diamondAddressWriteToFile);
	await fs.writeFile("./contract_addresses.js", JSON.parse(diamondAddressWriteToFileData), { flag: "a+" }, (err) => {
		if (err) {
			console.log("Error writing config.js:", err.message);
		}
	});
}

async function deployContracts() {
	await deployAutifyDiamond();
	await deployAutifyFacet();
	await deployAutifyGettersFacet();
	await deployAutifySettersFacet();
	await appendExportsLine();
}

// We recommend this pattern to be able to use async/await everywhere and properly handle errors.
if (require.main === module) {
	deployContracts()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error(error);
			process.exit(1);
		});
}

module.exports = { deployContracts, deployAutifyFacet, deployAutifyDiamond, deployAutifyGettersFacet, deployAutifySettersFacet };
