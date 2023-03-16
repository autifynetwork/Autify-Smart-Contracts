/* global ethers task */
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("dotenv").config();
const { deployContracts } = require("./scripts/deploy");
const { upgradeAutifyFacet } = require("./scripts/upgrades/upgrade-AutifyFacet");
const {
	AUTIFY_DIAMONDCUT_FACET,
	AUTIFY_DIAMONDLOUPE_FACET,
	AUTIFY_DIAMOND_ADDRESS,
	AUTIFY_OWNERSHIP_FACET,
	AUTIFY_FACET_ADDRESS,
	AUTIFY_GETTERS_FACET,
	AUTIFY_SETTERS_FACET,
} = require("./contract_addresses");

task("accounts", "Prints the list of accounts", async () => {
	const accounts = await ethers.getSigners();

	for (const account of accounts) {
		console.log(account.address);
	}
});

task("deploy", "Deploy smart contracts", async (taskArgs, hre) => {
	await deployContracts();
});

task("upgradeAutifyFacet", "Upgrade autify facet", async (taskArgs, hre) => {
	await upgradeAutifyFacet();
});

task("verify-contracts", "Verify smart contracts", async (taskArgs, hre) => {
	try {
		await hre.run("verify:verify", {
			address: AUTIFY_DIAMOND_CUT_FACET,
			constructorArguments: [],
		});
	} catch (error) {
		console.log(error);
	}

	try {
		await hre.run("verify:verify", {
			address: AUTIFY_DIAMOND_LOUPE_FACET,
			constructorArguments: [],
		});
	} catch (error) {
		console.log(error);
	}

	try {
		await hre.run("verify:verify", {
			address: AUTIFY_OWNERSHIP_FACET,
			constructorArguments: [],
		});
	} catch (error) {
		console.log(error);
	}

	try {
		await hre.run("verify:verify", {
			address: AUTIFY_FACET_ADDRESS,
			constructorArguments: ["https://gateway.autify.com/ipfs/", "https://www.autify.com/contract-metadata-uri"],
		});
	} catch (error) {
		console.log(error);
	}

	try {
		await hre.run("verify:verify", {
			address: AUTIFY_GETTERS_FACET,
			constructorArguments: [],
		});
	} catch (error) {
		console.log(error);
	}

	try {
		await hre.run("verify:verify", {
			address: AUTIFY_SETTERS_FACET,
			constructorArguments: [],
		});
	} catch (error) {
		console.log(error);
	}
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: "0.8.4",
	settings: {
		optimizer: {
			enabled: true,
			runs: 200,
		},
		contractSizer: {
			alphaSort: true,
			disambiguatePaths: false,
			runOnCompile: true,
		},
	},
	networks: {
		hardhat: {
			gas: 12000000,
			blockGasLimit: 210000000,
			// allowUnlimitedContractSize: true,
			timeout: 1800000,
		},
		mumbai: {
			url: "https://polygon-mumbai.g.alchemy.com/v2/8qorAGwStqgObuxITbYVAD3T2BI1jC36",
			accounts: [process.env.PRIVATE_KEY],
			gas: 12000000,
			gasPrice: 35000000000,
			blockGasLimit: 210000000,
			timeout: 1800000,
		},
		matic: {
			url: "https://polygon-mainnet.g.alchemy.com/v2/8qorAGwStqgObuxITbYVAD3T2BI1jC36",
			accounts: [process.env.PRIVATE_KEY],
			gas: 12000000,
			gasPrice: 130000000000,
			blockGasLimit: 210000000,
			timeout: 1800000,
		},
		cronos: {
			url: "https://cronos-testnet-3.crypto.org:8545/",
			accounts: [process.env.PRIVATE_KEY],
			gas: 12000000,
			gasPrice: 130000000000,
			blockGasLimit: 210000000,
			timeout: 1800000,
		},
	},
	etherscan: {
		apiKey: process.env.POLYGONSCAN_API_KEY,
	},
};
