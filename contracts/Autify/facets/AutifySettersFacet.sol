// contracts/Autify/facets/AutifySettersFacet.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.0;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { AutifyEternalStorage } from "../common/AutifyEternalStorage.sol";
import { Modifiers } from "../common/Modifiers.sol";

contract AutifySettersFacet is AutifyEternalStorage, Modifiers, AccessControl {
	function updateName(string memory newName) public onlyOwner {
		s.name = newName;
	}

	function updateSymbol(string memory newSymbol) public onlyOwner {
		s.symbol = newSymbol;
	}

	function updateContractURI(string memory newURI) public onlyOwner {
		s.contractURI = newURI;
	}

	function updateBaseURI(string memory newURI) public onlyOwner {
		s.baseURI = newURI;
	}

	function grantMinterRole(address minter) public virtual {
		// Check that the calling account has the admin role
		require(hasRole(s.ADMIN_ROLE, msg.sender), "Caller does not have admin role");
		// Grant minter role
		_setupRole(s.MINTER_ROLE, minter);
	}

	function grantAdminRole(address adminAddress) public virtual onlyOwner {
		// Grant admin role
		_setupRole(s.ADMIN_ROLE, adminAddress);
	}
}
