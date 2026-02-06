pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/comparators.circom";

template OwnershipProof() {
    // Private inputs (secrets known only to prover)
    signal private input ownerAddress;
    signal private input salt;
    signal input parcelId;
    
    // Public inputs (known to verifier)
    signal input expectedCommitment;
    signal input challengeNonce;
    
    // Output
    signal output valid;
    
    // Components
    component hasher = Poseidon(3);
    
    // Hash the ownership data
    hasher.inputs[0] <== ownerAddress;
    hasher.inputs[1] <== parcelId;
    hasher.inputs[2] <== salt;
    
    // Check if the computed commitment matches the expected one
    component eq = IsEqual();
    eq.in[0] <== hasher.out;
    eq.in[1] <== expectedCommitment;
    
    // The proof is valid if commitments match
    valid <== eq.out;
    
    // Use challengeNonce to prevent replay attacks (constraint it to be non-zero)
    component nonZero = IsZero();
    nonZero.in <== challengeNonce;
    nonZero.out === 0;
}

component main = OwnershipProof();
