import Web3 from 'web3';
import sequencerABI from './sequencerABI.json';

const rpcURL = 'https://mainnet.infura.io/v3/1e37ec6e4d714436aa51cbce932b06af';
const sequencerAddress = '0x238b4E35dAed6100C6162fAE4510261f88996EC9'

export const handler = async (event: any, context: any) => {
    try {
        // connection to sequencer contract
        const web3 = new Web3(rpcURL);
        const sequencerContract = new web3.eth.Contract(sequencerABI, sequencerAddress);
        const numNetworks = await sequencerContract.methods.numNetworks().call();
        console.log('Number of networks: ', numNetworks);
        // check last 10 blocks
        // send discord alert?
    } catch (error) {
        console.error(error);
    };
};

handler(null, null);