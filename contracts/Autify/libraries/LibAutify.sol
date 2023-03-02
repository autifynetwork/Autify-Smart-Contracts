// contracts/Autify/libraries/LibAutify.sol
// SPDX-License-Identifier: BSL 1.1
pragma solidity ^0.8.4;

import { SafeMath } from "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { Counters } from "./LibCounters.sol";
import { AutifyFacet } from "../facets/AutifyFacet.sol";

library LibAutify {
	using SafeMath for uint256;
	using Counters for Counters.Counter;
}
