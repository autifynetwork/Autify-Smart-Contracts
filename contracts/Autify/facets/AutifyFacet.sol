// contracts/Autify/facets/AutifyFacet.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.0;

import { ERC1155 } from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import { Pausable } from "@openzeppelin/contracts/security/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { AutifyEternalStorage } from "../common/AutifyEternalStorage.sol";
import { LibDiamond } from "../../shared/libraries/LibDiamond.sol";
import { LibAutify } from "../libraries/LibAutify.sol";
import { Counters } from "../libraries/LibCounters.sol";
import { Modifiers } from "../common/Modifiers.sol";

contract AutifyFacet is AutifyEternalStorage, ERC1155, Pausable, Modifiers, ReentrancyGuard {
	using SafeMath for uint256;
	using Counters for Counters.Counter;

	constructor(string memory baseURI_, string memory contractURI_) ERC1155(string(abi.encodePacked(baseURI_, "{id}"))) {
		__Autify_init_unchained(baseURI_, contractURI_);
	}

	function __Autify_init_unchained(string memory baseURI_, string memory contractURI_) public {
		s.name = "Autify Network";
		s.symbol = "AUT";
		s.contractURI = contractURI_;
		s.baseURI = baseURI_;
		s.MINTER_ROLE = keccak256("MINTER_ROLE");
		s.ADMIN_ROLE = keccak256("ADMIN_ROLE");
		_setURI(string(abi.encodePacked(baseURI_, "{id}")));
	}

	function pause() public virtual whenNotPaused onlyOwner {
		super._pause();
	}

	function unpause() public virtual whenPaused onlyOwner {
		super._unpause();
	}

	function updateURI(string memory newURI) public onlyOwner {
		_setURI(newURI);
	}

	// Overriding the uri function
	function uri(uint256 tokenId) public view virtual override returns (string memory) {
		return string(abi.encodePacked(s.baseURI, tokenId));
	}
}
