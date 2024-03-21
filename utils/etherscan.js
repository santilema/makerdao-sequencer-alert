"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWorkEventSignature = exports.fetchContractABI = void 0;
const path_1 = __importDefault(require("path"));
const promises_1 = require("fs/promises");
const ethers_1 = require("ethers");
/**
 * Fetches the ABI for a given contract from Etherscan.
 *
 * This function sends a GET request to the Etherscan API to retrieve the ABI
 * of a contract specified by its address. The Etherscan API key is required
 * to authenticate the request. If successful, it parses the ABI from the response
 * and returns it. Otherwise, it logs an error and returns null.
 *
 * @param address The Ethereum address of the contract for which to fetch the ABI.
 * @param etherscanApiKey Your Etherscan API key for authenticating the request.
 * @returns The ABI of the specified contract as a JSON object, or null if the
 *          fetch operation fails or if the ABI is not available.
 */
const fetchContractABI = async (address, etherscanApiKey) => {
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.status === "1" && data.message === "OK") {
            return JSON.parse(data.result);
        }
        else {
            console.error("Error fetching contract ABI");
            return null;
        }
    }
    catch (error) {
        console.error("Error fetching ABI");
        return null;
    }
};
exports.fetchContractABI = fetchContractABI;
/**
 * Retrieves the signature hash of the 'Work' event for a given job contract.
 *
 * First, it attempts to read the contract's ABI from a local JSON file. If the file
 * does not exist or reading fails, it fetches the ABI from Etherscan using the provided
 * Etherscan API key and saves the ABI locally. It then searches the ABI for the 'Work'
 * event and constructs its signature hash. If the 'Work' event is found, the function
 * returns its signature hash. Otherwise, it logs an error and returns undefined.
 *
 * @param jobAddress The Ethereum address of the job contract.
 * @param etherscanApiKey Your Etherscan API key for fetching the ABI, if necessary.
 * @returns The signature hash of the 'Work' event if found, or undefined if the
 *          'Work' event is not found in the ABI or if fetching the ABI fails.
 */
const getWorkEventSignature = async (jobAddress, etherscanApiKey) => {
    let abi;
    const abiPath = path_1.default.join(__dirname, "..", "jobsABIs", `${jobAddress}.json`);
    try {
        const abiJson = await (0, promises_1.readFile)(abiPath, "utf8");
        abi = JSON.parse(abiJson);
    }
    catch (error) {
        console.error(`Failed to read ABI for ${jobAddress}:`, error);
        abi = await (0, exports.fetchContractABI)(jobAddress, etherscanApiKey);
        if (abi) {
            await (0, promises_1.writeFile)(abiPath, JSON.stringify(abi), "utf-8");
            console.log(`ABI for ${jobAddress} saved to ${abiPath}`);
        }
        else {
            console.error(`Failed to fetch ABI for ${jobAddress}`);
            return undefined;
        }
    }
    for (const item of abi) {
        if (item.type == "event" && item.name == "Work") {
            const eventName = item.name;
            const paramsTypes = item.inputs.map((input) => input.type).join(",");
            const eventSignature = `${eventName}(${paramsTypes})`;
            console.log(eventSignature);
            return ethers_1.ethers.id(eventSignature);
        }
    }
    console.error(`Work event not found in ABI for  ${jobAddress}`);
    return undefined;
};
exports.getWorkEventSignature = getWorkEventSignature;
