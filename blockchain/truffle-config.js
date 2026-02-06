module.exports = {
  networks: {
    // Development network (Ganache)
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*", // Match any network id
      gas: 6721975,
      gasPrice: 20000000000, // 20 gwei
    },
    
    // You can add testnet configurations later
    // goerli: {
    //   provider: () => new HDWalletProvider(mnemonic, `https://goerli.infura.io/v3/${projectId}`),
    //   network_id: 5,
    //   gas: 5500000,
    //   confirmations: 2,
    //   timeoutBlocks: 200,
    //   skipDryRun: true
    // }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.19", // Use 0.8.19 to avoid PUSH0 opcode issues
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "london" // Explicitly target London EVM (no PUSH0)
      }
    }
  },

  // Truffle DB is currently disabled by default
  db: {
    enabled: false
  }
};
