import { ethers } from 'ethers';
import sequencerABI from './sequencerABI.json';

const rpcURL = 'https://mainnet.infura.io/v3/1e37ec6e4d714436aa51cbce932b06af';
const sequencerAddress = '0x238b4E35dAed6100C6162fAE4510261f88996EC9'

export const handler = async (event=null, context=null) => {
    try {
        // Connection to sequencer contract
        const provider = new ethers.JsonRpcProvider(rpcURL);
        const sequencerContract = new ethers.Contract(sequencerAddress, sequencerABI, provider);
        const numNetworks = await sequencerContract.numNetworks();
        const numJobs = await sequencerContract.numJobs();
        console.log('Number of networks: ', numNetworks);
        console.log('Number of jobs: ', numJobs);
        const firstNetwork = await sequencerContract.networkAt(0);
        console.log('First network: ', firstNetwork);
        // Check last 10 blocks

        // Send discord alert?
    } catch (error) {
        console.error(error);
    }
};

handler();