require("@nomiclabs/hardhat-waffle");
require('hardhat-contract-sizer');
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-truffle5");
// require('hardhat-docgen');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const secret = require('./.secret.js');

const apiKey = secret.pkApiKey;
const sk = secret.pk;
const izumiRpcUrl = "http://47.241.103.6:9545";

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10
      }
    }
  },

  networks: {
    arbitrum: {
      url: 'https://arb1.arbitrum.io/rpc',
      accounts: [sk]
    },
    polygon: {
      url: 'https://rpc-mainnet.maticvigil.com',
      accounts: [sk]
    },
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      gas: 10000000,
      gasPrice: 2500000000,
      accounts: [sk]
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      gas: 7792207,
      gasPrice: 13000000000,
      accounts: [sk]
    },
    bscTest: {
	    url: 'https://bsc-testnet-rpc.publicnode.com',
      accounts: [sk],
      // gas: 90000000,
      gasPrice: 10000000000,
    },
    bsc: {
	url: 'https://bsc-dataseed.binance.org/',
        accounts: [sk],
	gasPrice: 5000000000,
    },
    auroraTest: {
        url: 'https://testnet.aurora.dev',
        accounts: [sk],
    },
    mantle: {
        url: 'https://rpc.mantle.xyz',
        accounts: [sk],
    },
    scroll: {
        url: 'https://rpc.scroll.io',
        accounts: [sk],
    },
    manta: {
        url: 'https://manta-pacific.calderachain.xyz/http',
	      accounts: [sk],
    },
    zeta: {
        url: 'https://zetachain-evm.blockpi.network/v1/rpc/public',
        accounts: [sk],
    },
    merlinTest: {
      url: 'https://testnet-rpc.merlinchain.io',
      accounts: [sk],
    },
    merlin: {
      url: 'https://endpoints.omniatech.io/v1/merlin/mainnet/public',
      accounts: [sk],
      gasPrice: 0.006 * (10**9)
    },
    cyber: {
      url: 'https://cyber.alt.technology/',
      accounts: [sk],
    },
    klaytn: {
      url: 'https://klaytn.blockpi.network/v1/rpc/public',
      accounts: [sk],
    },
    neon: {
      url: 'https://neon-proxy-mainnet.solana.p2p.org',
      accounts: [sk],
    },
    taiko: {
      url: 'https://rpc.taiko.xyz	',
      accounts: [sk],
      gasPrice: 12000000,
    },
    flow: {
      url: 'https://mainnet.evm.nodes.onflow.org',
      accounts: [sk],
    },
    iotex: {
      url: 'https://babel-api.fastblocks.io',
      accounts: [sk],
    },
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  },
  etherscan: {
	  apiKey: apiKey,
  }
};
