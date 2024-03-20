import { ethers } from "ethers";
import sequencerABI from "./sequencerABI.json";
import { writeFile, readFile } from "fs/promises";
import path from "path";

const discordWebhook =
  "https://discord.com/api/webhooks/1220031157979054170/XPvttjb-QEFlz4h5degD0gYN5OdWC2NnLTxhIxDxR2OQEDIRpCZOd_o6Zc1eqcczR4Hq";
const rpcURL = "https://mainnet.infura.io/v3/1e37ec6e4d714436aa51cbce932b06af";
const sequencerAddress = "0x238b4E35dAed6100C6162fAE4510261f88996EC9";
const etherscanApiKey = "5BT1H9Z8GWNJDVCRH25RGJUHJDRFE7EK44";
const blocksWindow = 10;

type Job = {
  address: string;
  workEvent: string;
};

const jobs: Job[] = [];

const sendDiscordAlert = async (webhookUrl: string, message: string) => {
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
    } else {
      console.log("Discord alert sent");
    }
  } catch (error) {
    console.error("Failed to send discord alert", error);
  }
};

const getWorkEventSignature = async (
  jobAddress: string
): Promise<string | undefined> => {
  try {
    const abiPath = path.join(__dirname, "jobsABIs", `${jobAddress}.json`);
    const abiJson = await readFile(abiPath, "utf8");
    const abi = JSON.parse(abiJson);

    for (const item of abi) {
      if (item.type == "event" && item.name == "Work") {
        const eventName = item.name;
        const paramsTypes = item.inputs
          .map((input: any) => input.type)
          .join(",");
        const eventSignature = `${eventName}(${paramsTypes})`;
        console.log(eventSignature);
        return ethers.id(eventSignature);
      }
    }
    console.error(`Work event not found in ABI for  ${jobAddress}`);
  } catch (error) {
    console.log(`Failed to read ABI for ${jobAddress}:`, error);
  }
  return undefined;
};

export const handler = async (event = null, context = null) => {
  try {
    let alert = true;
    // Connection to sequencer contract
    const provider = new ethers.JsonRpcProvider(rpcURL);
    const sequencerContract = new ethers.Contract(
      sequencerAddress,
      sequencerABI,
      provider
    );

    // Define window of blocks
    const latestBlockNumber = await provider.getBlockNumber(); //current block
    const earliestBlockNumber = latestBlockNumber - blocksWindow;
    console.log(
      "latestBlockNumber",
      latestBlockNumber,
      "earliestBlockNumber",
      earliestBlockNumber
    );

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
      sendDiscordAlert(
        discordWebhook,
        `No job was worked on in the last ${blocksWindow} blocks at block ${latestBlockNumber}`
      );
    } else {
      console.log("Work was done");
    }
  } catch (error) {
    console.error(error);
  }
};

handler();
