// contracts/Autify/facets/AutifyGettersFacet.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.0;

import { Counters } from "../libraries/LibCounters.sol";
import { AutifyEternalStorage } from "../common/AutifyEternalStorage.sol";

contract AutifyGettersFacet is AutifyEternalStorage {
	using Counters for Counters.Counter;

	/// @notice Return the universal name of the NFT
	function name() external view returns (string memory) {
		return s.name;
	}

	/// @notice An abbreviated name for NFTs in this contract
	function symbol() external view returns (string memory) {
		return s.symbol;
	}

	function contractURI() external view returns (string memory) {
		return s.contractURI;
	}

	function baseURI() external view returns (string memory) {
		return s.baseURI;
	}
}
