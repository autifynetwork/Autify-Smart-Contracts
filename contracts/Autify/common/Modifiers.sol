// contracts/Autify/common/Modifiers.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.0;

import { LibDiamond } from "../../shared/libraries/LibDiamond.sol";

contract Modifiers {
	modifier onlyOwner() {
		LibDiamond.enforceIsContractOwner();
		_;
	}

	/***********************************|
    |              Events               |
    |__________________________________*/
}
