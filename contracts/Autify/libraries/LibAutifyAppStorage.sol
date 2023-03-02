// contracts/Autify/libraries/LibAutifyAppStorage.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.0;

/// @dev Note: This contract is meant to declare any storage and is append-only. DO NOT modify old variables!

import { Counters } from "./LibCounters.sol";

/***********************************|
|    Variables, structs, mappings   |
|__________________________________*/

struct AutifyAppStorage {
	string name;
	string symbol;
	string contractURI;
	string baseURI;
	// Role identifier for the admin role
	bytes32 ADMIN_ROLE;
	// Role identifier for the minter role
	bytes32 MINTER_ROLE;
}

library LibAutifyAppStorage {
	function diamondStorage() internal pure returns (AutifyAppStorage storage ds) {
		assembly {
			ds.slot := 0
		}
	}

	function abs(int256 x) internal pure returns (uint256) {
		return uint256(x >= 0 ? x : -x);
	}
}
