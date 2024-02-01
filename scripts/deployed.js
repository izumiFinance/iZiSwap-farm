const contracts = {
    auroraTest: {
	liquidityManager: '0xEa0f268a066dF3329283b0AF7560e19B89c35511',
        WETH: '0x67A1f4A939b477A6b7c5BF94D97E45dE87E608eF',
        iZi: '0x876508837C162aCedcc5dd7721015E83cbb4e339',
	USDT: '0x6a7436775c0d0B70cfF4c5365404ec37c9d9aF4b',
	USDC: '0x6AECfe44225A50895e9EC7ca46377B9397D1Bb5b',
        ARC: '0xa341a31CCdD570cAEab465c96D64c880db609021',
        IUSD: '0xb0453a1bAf6056393897e60dfd851C61A825ef67',
    },
    bscTest: {
        liquidityManager: '0xDE02C26c46AC441951951C97c8462cD85b3A124c',
        WBNB: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
        iZi: '0x551197e6350936976DfFB66B2c3bb15DDB723250',
	APEX: '0x7a8176293E5dbf4a18716bB03888442cb77dc386',
        BIT: '0xac360dc0F8EF1C94Ab4034220E0A01567acbFdE4',
        USDT: '0x6AECfe44225A50895e9EC7ca46377B9397D1Bb5b',
	FeeAWrapper: '0xa52A8da39fff2f31c8b60eee4aa0426e14a2D144',
	FeeA: '0x0c08e73Abe0Fc445e727Ca9b779D22649110f782',
	FeeBWrapper: '0x5a2FEa91d21a8D53180020F8272594bf0D6F36DC',
	FeeB: '0x0C2CE63c797190dAE219A92AeBE4719Dc83AADdf',
        USDC: '0x876508837C162aCedcc5dd7721015E83cbb4e339',
    	iUSD: '0x60FE1bE62fa2082b0897eA87DF8D2CfD45185D30',
	BUSD: '0xd88972676f5D0997c8150A3d2C4634CbaaDD3396',
        SLD: '0x45F76eD56082cd0B0A0Ad1E4513214d1219f9998',
        DUET: '0x5D111A3573838f6A24B4b64dbE6A234bE1e6d822',
        dWTI: '0x967b61E062205C2DcbB6146b383119A8827493C3',
        DUSD: '0x5682fBb54565b02a4E72Ce29C5a9B61Dee8a0819',
        USDT18: '0x3eC84d8bDD27Db0FD49462187b0bd8E347bBc1e7',
        KSW: '0xe377BA982D52C598568cE37dd146ced237FFd938',
        REVO: '0x1e19F04008f57344D589494C50Ff8138aD5207Ae',
        LAND: '0x1017D7d37169f98EED32BBB68aD79A3881174e3f',
        FROYO: '0xed2F92D6D2b936ce3Db9e046E57D9119e4A31ECb',
	T6Wrapper: '0x60A1321f92FED22e68e91bcF168A33d0387611Be',
    },
    bsc: {
        iZi: '0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747',
        BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56',
	TAP: '0x35bedbf9291b22218a0da863170dcc9329ef2563',
        USDT: '0x55d398326f99059fF775485246999027B3197955',
        USDC: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
        iUSD: '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d',
        WBNB: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
        liquidityManager: '0x93C22Fbeff4448F2fb6e432579b0638838Ff9581',
        SLD: '0x1ef6A7e2c966fb7C5403EFEFdE38338b1a95a084',
        KSW: '0x270178366a592bA598C2e9d2971DA65f7bAa7C86',
        REVO: '0xfC279e6ff1FB1C7F5848d31561cAb27d34a2856b',
        LAND: '0x9A981FAcCD3B9b3B9453BFF266296fc0f2De21a2',
        NAS: '0x2E1F3D4cB35980F6339C006e64AC3a555dB6676d',
        FROYO: '0xe369fec23380f9f14ffd07a1dc4b7c1a9fdd81c9',
	MNW: '0x8e596702b7e84907836776fddc56067b64147c8f',
	MELT: '0x7eb35225995b097c84eF10501dD6E93A49bdFd63',
	DMT: '0x09CdC7E87ABd416246F1015B08B4463Abdda00B4',
	BURGER: '0xAe9269f27437f0fcBC232d39Ec814844a51d6b8f',
	GE: '0x708F90170722f8F8775bf64d7f435A2BADBd89FD',
        RIV: '0xCa5e32d44F1744001b5600Dc2F5F5e0BbB6E9D3e',
        SD: '0x3BC5AC0dFdC871B365d159f728dd1B9A0B5481E8',
        BNBX: '0x1bdd3Cf7F79cfB8EdbB955f20ad99211551BA275',
    COCA: '0x44516Eb3D488175128D257748610426a866937D8',
    ANTWrapper: '0xa0D289c752FE23043f29BD81e30D8345180bD9BB',
        FEVR: '0x82030CDBD9e4B7c5bb0b811A61DA6360D69449cc',
        ANKR: '0xf307910A4c7bbc79691fD374889b36d8531B08e3',
        GRI: '0xD767713e787Cb351e4daFb777DD93d54f5381D29',
        aBNBc: '0xE85aFCcDaFBE7F2B096f268e31ccE3da8dA2990A',
        ZBC: '0x37a56cdcD83Dce2868f721De58cB3830C44C6303',
        ERA: '0x6f9F0c4ad9Af7EbD61Ac5A1D4e0F2227F7B0E5f9',
        GOT: '0xDA71E3eC0d579FED5dbABa31eEaD3cEB9e77A928',
        WOO: '0x4691937a7508860F876c9c0a2a617E7d9E945D4B',
        ankrBNB: '0x52f24a5e03aee338da5fd9df68d2b6fae1178827',
        ANKR: '0xf307910A4c7bbc79691fD374889b36d8531B08e3',
	LING: '0x68c0E798b749183c97239114BB76fd1e5e3DB98C',
	HYT: '0xE28C51f4fa57dC44af3691c6f73D1ca578b586Be',
	MIT: '0xe6906717f129427eebade5406de68cadd57aa0c0',
        slUSDT: '0x65cd2e7d7bacdac3aa9dae68fb5d548dfe1fefb5',
        slUSDC: '0x55a26773a8ba7fa9a8242b43e14a69488e6d2b05',
        slBTC: '0xe04b30f233e3bc96da2401ee146a94f1c7c54917',
        slETH: '0xdf6964c7ccfabaace7c3f918b795fa4a894589c8',
        TLOS: '0xb6C53431608E626AC81a9776ac3e999c5556717c',
        HALO: '0xb6b8ccd230bb4235c7b87986274e7ab550b72261',
        CCC: '0x383268691eE31c68489B19b8F2D7003ec504D534',
	ARBI: '0xa7bD657C5838472dDF85FF0797A2e6fce8fd4833',
    },
    arbitrum: {
        slUSDT: '0x65cd2e7d7bacdac3aa9dae68fb5d548dfe1fefb5',
        slUSDC: '0x55a26773a8ba7fa9a8242b43e14a69488e6d2b05',
        slBTC: '0xe04b30f233e3bc96da2401ee146a94f1c7c54917',
        slETH: '0xdf6964c7ccfabaace7c3f918b795fa4a894589c8',
        iUSD: '0x0a3bb08b3a15a19b4de82f8acfc862606fb69a2d',
        iZi: '0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747',
        MTG: '0x748b5be12ac1ce2ef73035189f943591c1822b7d',
        USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
        liquidityManager: '0x611575eE1fbd4F7915D0eABCC518eD396fF78F0c',
        ARBI: '0x07DD5BEAffb65B8fF2e575d500BDf324a05295DC',
	ETH: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    },
    ethereum: {
	
    },
    mantle: {
        liquidityManager: '0x611575eE1fbd4F7915D0eABCC518eD396fF78F0c',
        iZi: '0x60D01EC2D5E98Ac51C8B4cF84DfCCE98D527c747',
        USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE',
        MINU: '0x51cfe5b1e764dc253f4c8c1f19a081ff4c3517ed',
        MNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8',
        LEND: '0x25356aeca4210ef7553140edb9b8026089e49396',
        USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
        BEL: '0x3390108E913824B8eaD638444cc52B9aBdF63798',
        AXL: '0x23ee2343B892b1BB63503a4FAbc840E0e2C6810f',
        CTT: '0x6a3b0eb5b57c9a4f5772fc900dae427e65f8c1a5',
        USDY: '0x5be26527e817998a7206475496fde1e68957c5a6',
        USDLR: '0x8FE7176F0BF63358ad9490fd24Ac0bdB4Dac33a8',
        mETH: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0',
        ETH: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111',
    },
    linea: {
        liquidityManager: '0x1CB60033F61e4fc171c963f0d2d3F63Ece24319c',
        LAB: '0xB97F21D1f2508fF5c73E7B5AF02847640B1ff75d',
        iZi: '0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747',
        USDC: '0x176211869ca2b568f2a7d4ee941e073a821ee1ff',
    },
    scroll: {
        liquidityManager: '0x1502d025BfA624469892289D45C0352997251728',
        LAB: '0x2A00647F45047f05BDed961Eb8ECABc42780e604',
        USDC: '0x06efdbff2a14a7c8e15944d1f4a48f9f95f663a4',
        iZi: '0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747',
        SKY: '0x95a52EC1d60e74CD3Eb002fE54A2c74b185A4C16',
    },
    manta: {
        liquidityManager: '0x19b683A2F45012318d9B2aE1280d68d3eC54D663',
        ASM: '0xCd5d6dE3fdBce1895F0Dac13A065673599ED6806',
        STONE: '0xEc901DA9c68E90798BbBb74c11406A32A70652C3',
        iZi: '0x91647632245caBf3d66121F86C387aE0ad295F9A',
    },
    zeta: {
        liquidityManager: '0x2db0AFD0045F3518c77eC6591a542e326Befd3D7',
        USDT_bsc: '0x91d4F0D54090Df2D81e834c3c8CE71C6c865e79F',
        ETH: '0xd97B1de3619ed2c6BEb3860147E30cA8A7dC9891',
        stZETA: '0x45334a5b0a01ce6c260f2b570ec941c680ea62c0',
        ZETA: '0x5f0b1a82749cb4e2278ec87f8bf6b618dc71a8bf',
        USDT_eth: '0x7c8dDa80bbBE1254a7aACf3219EBe1481c6E01d7',
        iZi: '0x60d01ec2d5e98ac51c8b4cf84dfcce98d527c747',
    },
}

module.exports = contracts;
