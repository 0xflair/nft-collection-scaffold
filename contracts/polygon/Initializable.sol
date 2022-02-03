// SPDX-License-Identifier: AGPL-3.0

pragma solidity 0.8.3;

contract Initializable {
    bool inited = false;

    modifier initializer() {
        require(!inited, 'already inited');
        _;
        inited = true;
    }
}
