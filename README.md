# Autify Network Diamond

The [**Autify Network Diamond**](https://autifynetwork.com/exploring-erc-2535-the-diamond-standard-for-smart-contracts/)  is an implementation that leverages the [EIP-2535 Diamond Standard](https://eips.ethereum.org/EIPS/eip-2535).

The standard loupe functions have been gas-optimized in this implementation and can be called in on-chain transactions.

**Note:** The loupe functions in DiamondLoupeFacet.sol MUST be added to the diamond and are required by the EIP-2535 Diamonds standard.

## Installation

1. Clone this repo:
```console
git clone https://github.com/autifynetwork/Autify-Smart-Contracts
```

2. Install NPM packages:
```console
cd Autify-Smart-Contracts
npm install
```

## Run tests:

To run all test files-
```console
npx hardhat test
```

To run a single test file-
```console
npx hardhat test test/autify.test.ts
```

## Check the size of contracts

```console
npx hardhat size-contracts
```

## Deployment

Create a `.env` file in the `.env.example` file format.
Add your secrets and api keys.

```console
npx hardhat run scripts/deploy.js
```

or

```console
npx hardhat deploy --network <NETWORK_NAME>
```

New contract addresses will automatically be added to the `contract_addresses.js` file.

**Things to keep in mind during development & deployment-**

1. Storage Collision

https://forum.openzeppelin.com/t/openzeppelin-upgrades-step-by-step-tutorial-for-hardhat/3580/4

2. Constructor functions don't work in Facets

https://eip2535diamonds.substack.com/p/constructor-functions-dont-work-in?s=w

### How the scripts/deploy.js script works

1. DiamondCutFacet is deployed.
1. The diamond is deployed, passing as arguments to the diamond constructor the owner address of the diamond and the DiamondCutFacet address. DiamondCutFacet has the `diamondCut` external function which is used to upgrade the diamond to add more functions.
1. The `DiamondInit` contract is deployed. This contains an `init` function which is called on the first diamond upgrade to initialize state of some state variables. Information on how the `diamondCut` function works is here: https://eips.ethereum.org/EIPS/eip-2535#diamond-interface
1. Facets are deployed.
1. The diamond is upgraded. The `diamondCut` function is used to add functions from facets to the diamond. In addition the `diamondCut` function calls the `init` function from the `DiamondInit` contract using `delegatecall` to initialize state variables.


## Verifying source code on block explorer

Check that `contract_addresses.js` has the correct facet addresses.

Then, run the script to verify all contracts at once-
```console
npx hardhat verify-contracts --network mumbai
```

or 

To verify contracts individually-
```console
npx hardhat verify CONTRACT_ADDR --network mumbai
```

With constructor arguments-
```console
npx hardhat verify 0x434c83d0d44eF9B6a2295C0a43DA2b065265075a --network mumbai 
"https://gateway.autify.com/ipfs/" "https://www.autify.com/contract-metadata-uri"
```

## Upgrading the diamond

Check the `scripts/upgrades/upgrade-AutifyFacet.js` file for example of upgrades.

Note that any number of functions from any number of facets can be added/replaced/removed on a diamond in a single transaction. In addition an initialization function can be executed in the same transaction as an upgrade to initialize any state variables required for an upgrade. This 'everything done in a single transaction' capability ensures a diamond maintains a correct and consistent state during upgrades.

Refer- https://github.com/mudgen/diamond-3-hardhat/blob/main/test/diamondTest.js

### Steps to make an upgrade-

- Check the task in `hardhat.config.js` & the upgrade file, and then run-
```console
npx hardhat upgradeAutifyFacet --network mumbai
```

- Update the upgraded facet address in `contract_addresses.js`

- Then verify the contract-
```console
npx hardhat verify CONTRACT_ADDR --network mumbai "<param1>" "<param2>"
```

## Facet Information

The `contracts/shared/AutifyDiamond.sol` file shows the implementation of Autify Network Diamond.

The `contracts/shared/facets/DiamondCutFacet.sol` file shows how to implement the `diamondCut` external function.

The `contracts/shared/facets/DiamondLoupeFacet.sol` file shows how to implement the four standard loupe functions.

The `contracts/shared/libraries/LibDiamond.sol` file shows how to implement Diamond Storage and the `diamondCut` internal function.

The `scripts/deploy.js` file has functions that show how to deploy the diamond.

The `test/diamond.test.js` file gives tests for the `diamondCut` function and the Diamond Loupe functions.
