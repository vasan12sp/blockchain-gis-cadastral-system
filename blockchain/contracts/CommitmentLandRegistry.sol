// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

/// @title CommitmentLandRegistry
/// @notice A privacy-first on-chain registry using the Ownable pattern for access control.
/// @dev The contract 'owner' is the super admin, while a separate 'registrationAuthority' handles daily operations.
contract CommitmentLandRegistry is Ownable {
    
    // --- STATE ---
    address public registrationAuthority;
    

    struct Parcel {
        uint256 parcelId;
        bytes32 commitment;
        bytes32 ipfsCidHash;
        uint256 parentId;
        bool active;
    }

    mapping(uint256 => Parcel) public parcels;
    mapping(bytes32 => uint256) public commitmentToParcel;
    mapping(bytes32 => bool) public nullified;

    // --- EVENTS ---
    event CommitmentRegistered(uint256 indexed parcelId, bytes32 indexed commitment, bytes32 ipfsCidHash, uint256 parentId, uint256 timestamp);
    event CommitmentUpdated(uint256 indexed parcelId, bytes32 indexed oldCommitment, bytes32 indexed newCommitment, bytes32 newIpfsCidHash, uint256 timestamp);
    event CommitmentRevoked(uint256 indexed parcelId, bytes32 indexed commitment, uint256 timestamp);
    event NullifierPublished(bytes32 indexed nullifier, uint256 timestamp);
    event RegistrationAuthorityChanged(address indexed newAuthority);

    // --- MODIFIERS ---
    modifier onlyRA() {
        require(msg.sender == registrationAuthority, "Caller is not the RA");
        _;
    }

    // --- CONSTRUCTOR (Updated for OpenZeppelin v4.x) ---
    constructor() {
        // In OpenZeppelin v4.x, the deployer automatically becomes the owner
        // No need to pass parameters to Ownable()
        registrationAuthority = 0xbA90f7aaA05Bd84e7746dda4A3d98da07365e2A6; // <-- PUT THE ADDRESS HERE
        emit RegistrationAuthorityChanged(registrationAuthority);
    }

    // ============================
    // ===  MANAGEMENT FUNCTIONS ===
    // ============================

    /// @notice Sets or changes the Registration Authority address.
    /// @dev Can only be called by the contract owner (the Admin).
    function setRegistrationAuthority(address _newAuthority) external onlyOwner {
        require(_newAuthority != address(0), "RA cannot be zero address");
        registrationAuthority = _newAuthority;
        emit RegistrationAuthorityChanged(_newAuthority);
    }

    // ============================
    // === RA-Only Operations  ====
    // ============================

    /// @notice Register a new parcel commitment (initial registration).
    function registerCommitment(
        uint256 parcelId,
        bytes32 commitment,
        bytes32 ipfsCidHash,
        uint256 parentId
    ) external onlyRA {
        require(parcelId != 0, "parcelId cannot be zero");
        require(commitment != bytes32(0), "invalid commitment");
        require(commitmentToParcel[commitment] == 0, "commitment already registered");
        require(parcels[parcelId].parcelId == 0, "parcelId already used");

        parcels[parcelId] = Parcel({
            parcelId: parcelId,
            commitment: commitment,
            ipfsCidHash: ipfsCidHash,
            parentId: parentId,
            active: true
        });

        commitmentToParcel[commitment] = parcelId;
        emit CommitmentRegistered(parcelId, commitment, ipfsCidHash, parentId, block.timestamp);
    }

    /// @notice Approve and perform a transfer: replace old commitment with new commitment for same parcelId.
    function approveTransfer(
        uint256 parcelId,
        bytes32 oldCommitment,
        bytes32 newCommitment,
        bytes32 newIpfsCidHash,
        bytes32 nullifierForOld
    ) external onlyRA {
        require(parcelId != 0, "invalid parcelId");
        Parcel storage p = parcels[parcelId];
        require(p.parcelId != 0 && p.active, "parcel not active/exist");
        require(p.commitment == oldCommitment, "old commitment mismatch");
        require(newCommitment != bytes32(0), "invalid new commitment");
        require(commitmentToParcel[newCommitment] == 0, "new commitment already used");

        if (nullifierForOld != bytes32(0)) {
            require(!nullified[nullifierForOld], "nullifier already published");
            nullified[nullifierForOld] = true;
            emit NullifierPublished(nullifierForOld, block.timestamp);
        }

        commitmentToParcel[oldCommitment] = 0;
        commitmentToParcel[newCommitment] = parcelId;

        bytes32 old = p.commitment;
        p.commitment = newCommitment;
        p.ipfsCidHash = newIpfsCidHash;

        emit CommitmentUpdated(parcelId, old, newCommitment, newIpfsCidHash, block.timestamp);
    }

    /// @notice Approve and perform split: mark parent inactive and register N child commitments.
    function approveSplit(
        uint256 parentParcelId,
        uint256[] calldata newParcelIds,
        bytes32[] calldata newCommitments,
        bytes32[] calldata newIpfsCidHashes,
        bytes32 nullifierForParent
    ) external onlyRA {
        require(parentParcelId != 0, "invalid parent id");
        Parcel storage parent = parcels[parentParcelId];
        require(parent.parcelId != 0 && parent.active, "parent not active/exist");

        uint256 n = newParcelIds.length;
        require(n > 0, "no children provided");
        require(n == newCommitments.length && n == newIpfsCidHashes.length, "array length mismatch");

        if (nullifierForParent != bytes32(0)) {
            require(!nullified[nullifierForParent], "nullifier already published");
            nullified[nullifierForParent] = true;
            emit NullifierPublished(nullifierForParent, block.timestamp);
        }

        parent.active = false;
        
        for (uint256 i = 0; i < n; i++) {
            _registerChildParcel(newParcelIds[i], newCommitments[i], newIpfsCidHashes[i], parentParcelId);
        }
    }

    /// @notice Revoke a parcel (e.g., cancel or deprecate). RA-only.
    function revokeParcel(uint256 parcelId) external onlyRA {
        require(parcelId != 0, "invalid parcelId");
        Parcel storage p = parcels[parcelId];
        require(p.parcelId != 0 && p.active, "parcel not active/exist");

        bytes32 comm = p.commitment;
        p.active = false;
        commitmentToParcel[comm] = 0;

        emit CommitmentRevoked(parcelId, comm, block.timestamp);
    }

    // ============================
    // === Internal functions  ====
    // ============================

    function _registerChildParcel(
        uint256 childId,
        bytes32 childCommit,
        bytes32 childCidHash,
        uint256 parentParcelId
    ) internal {
        require(childId != 0, "child id zero");
        require(parcels[childId].parcelId == 0, "child id already used");
        require(childCommit != bytes32(0), "child commitment zero");
        require(commitmentToParcel[childCommit] == 0, "child commitment used");

        parcels[childId] = Parcel({
            parcelId: childId,
            commitment: childCommit,
            ipfsCidHash: childCidHash,
            parentId: parentParcelId,
            active: true
        });

        commitmentToParcel[childCommit] = childId;
        emit CommitmentRegistered(childId, childCommit, childCidHash, parentParcelId, block.timestamp);
    }

    // ============================
    // ===== View functions  =====
    // ============================

    function getParcel(uint256 parcelId) external view returns (uint256, bytes32, bytes32, uint256, bool) {
        Parcel memory p = parcels[parcelId];
        return (p.parcelId, p.commitment, p.ipfsCidHash, p.parentId, p.active);
    }

    function getParcelIdByCommitment(bytes32 commitment) external view returns (uint256) {
        return commitmentToParcel[commitment];
    }

    function isNullified(bytes32 nullifier) external view returns (bool) {
        return nullified[nullifier];
    }
}
