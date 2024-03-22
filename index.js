"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const etherscan_1 = require("./utils/etherscan");
const alerts_1 = require("./utils/alerts");
const sequencerABI_json_1 = __importDefault(require("./sequencerABI.json"));
const ethers_1 = require("ethers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const discordWebhook = process.env.DISCORD_WEBHOOK;
const rpcURL = process.env.RPC_URL;
const sequencerAddress = process.env.SEQUENCER_ADDRESS;
const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
const blocksWindow = 10;
/**
 * Monitors job contract activities within a specified number of recent blocks and
 * sends a Discord alert if no job was worked on.
 *
 * This handler function connects to a blockchain via an Ethereum JSON RPC provider
 * and interacts with a sequencer contract to enumerate job contracts. It checks each
 * job contract to see if the 'Work' event was emitted in the last `blocksWindow` blocks,
 * indicating that work has been done. If no 'Work' event is found for any job within
 * the specified block window, it sends an alert to a Discord channel. Otherwise, it
 * logs that work has been done.
 *
 * @param event Optional parameter that can be used to pass event data to the handler,
 *              not used in the current implementation.
 * @param context Optional parameter that can be used to provide runtime information to
 *                the handler, not used in the current implementation.
 */
const handler = async (event = null, context = null) => {
    try {
        let alert = true;
        // Connection to sequencer contract
        const provider = new ethers_1.ethers.JsonRpcProvider(rpcURL);
        const sequencerContract = new ethers_1.ethers.Contract(sequencerAddress, sequencerABI_json_1.default, provider);
        // Define window of blocks
        const latestBlockNumber = await provider.getBlockNumber(); //current block
        const earliestBlockNumber = latestBlockNumber - blocksWindow;
        console.log("latestBlockNumber", latestBlockNumber, "earliestBlockNumber", earliestBlockNumber);
        // Get the jobs
        const numJobs = await sequencerContract.numJobs();
        console.log("numJobs", numJobs);
        // fetch Work events in parallel
        const jobPromises = Array.from({ length: Number(numJobs) }, async (_, i) => {
            const jobAddress = await sequencerContract.jobAt(i);
            // Get Work event signature for each job
            const workEventSignatureHash = await (0, etherscan_1.getWorkEventSignature)(jobAddress, etherscanApiKey);
            // Filter looking for event signature meaning that work was done
            const filter = {
                address: jobAddress,
                fromBlock: earliestBlockNumber,
                toBlock: latestBlockNumber,
                topics: [
                    workEventSignatureHash
                        ? workEventSignatureHash
                        : "Work(bytes32,address)",
                ],
            };
            const logs = await provider.getLogs(filter);
            console.log("logs", jobAddress, logs);
            return { jobAddress, workEventSignatureHash, logs };
        });
        const jobs = await Promise.all(jobPromises);
        // If no logs were found, then no jobs have been worked on
        alert = jobs.every((job) => job.logs.length == 0);
        if (alert) {
            console.log("No work was done");
            (0, alerts_1.sendAlert)(discordWebhook, `No job was worked on in the last ${blocksWindow} blocks at block ${latestBlockNumber}`);
        }
        else {
            console.log("Work was done");
        }
    }
    catch (error) {
        console.error(error);
    }
};
exports.handler = handler;
