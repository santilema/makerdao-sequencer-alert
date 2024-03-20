"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const ethers_1 = require("ethers");
const sequencerABI_json_1 = __importDefault(require("./sequencerABI.json"));
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
const discordWebhook = "https://discord.com/api/webhooks/1220031157979054170/XPvttjb-QEFlz4h5degD0gYN5OdWC2NnLTxhIxDxR2OQEDIRpCZOd_o6Zc1eqcczR4Hq";
const rpcURL = "https://mainnet.infura.io/v3/1e37ec6e4d714436aa51cbce932b06af";
const sequencerAddress = "0x238b4E35dAed6100C6162fAE4510261f88996EC9";
const etherscanApiKey = "5BT1H9Z8GWNJDVCRH25RGJUHJDRFE7EK44";
const blocksWindow = 10;
const jobs = [];
const sendDiscordAlert = async (webhookUrl, message) => {
    try {
        const response = await fetch(webhookUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ content: message }),
        });
        if (!response.ok) {
            console.error("Failed to send discord alert");
        }
        else {
            console.log("Discord alert sent");
        }
    }
    catch (error) {
        console.error("Failed to send discord alert", error);
    }
};
const fetchContractABI = async (address) => {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        // check if ABI was returned
        if (data.status == "1" && data.message == "OK") {
            return await JSON.parse(data.result);
        }
        else {
            console.error("Error fetching contract ABI");
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching ABI", error);
        return null;
    }
};
const getWorkEventSignature = async (jobAddress) => {
    try {
        const abiPath = path_1.default.join(__dirname, "jobsABIs", `${jobAddress}.json`);
        const abiJson = await (0, promises_1.readFile)(abiPath, "utf8");
        const abi = JSON.parse(abiJson);
        for (const item of abi) {
            if (item.type == "event" && item.name == "Work") {
                const eventName = item.name;
                const paramsTypes = item.inputs
                    .map((input) => input.type)
                    .join(",");
                const eventSignature = `${eventName}(${paramsTypes})`;
                console.log(eventSignature);
                return ethers_1.ethers.id(eventSignature);
            }
        }
        console.error(`Work event not found in ABI for  ${jobAddress}`);
    }
    catch (error) {
        console.log(`Failed to read ABI for ${jobAddress}:`, error);
    }
    return undefined;
};
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
        const jobs = [];
        console.log("numJobs", numJobs);
        for (let i = 0; i < numJobs; i++) {
            const jobAddress = await sequencerContract.jobAt(i);
            // Get Work event signature for each job
            const workEventSignatureHash = await getWorkEventSignature(jobAddress);
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
            const job = {
                address: jobAddress,
                workEventSignature: workEventSignatureHash,
            };
            jobs.push(job);
            if (logs.length > 0) {
                alert = false;
            }
        }
        // Send discord alert?
        if (alert) {
            console.log("No work was done");
            sendDiscordAlert(discordWebhook, `No job was worked on in the last ${blocksWindow} blocks at block ${latestBlockNumber}`);
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
(0, exports.handler)();
