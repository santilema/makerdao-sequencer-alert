import path from "path";
import { writeFile, readFile } from "fs/promises";
import { ethers } from "ethers";

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
export const fetchContractABI = async (
  address: string,
  etherscanApiKey: string
): Promise<any> => {
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${etherscanApiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.status === "1" && data.message === "OK") {
      return JSON.parse(data.result);
    } else {
      console.error("Error fetching contract ABI");
      return null;
    }
  } catch (error) {
    console.error("Error fetching ABI");
    return null;
  }
};

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
export const getWorkEventSignature = async (
  jobAddress: string,
  etherscanApiKey: string
): Promise<string | undefined> => {
  let abi;
  const abiPath = path.join(__dirname, "../..", "jobsABIs", `${jobAddress}.json`);
  try {
    const abiJson = await readFile(abiPath, "utf8");
    abi = JSON.parse(abiJson);
  } catch (error) {
    console.error(`Failed to read ABI for ${jobAddress}:`, error);
    abi = await fetchContractABI(jobAddress, etherscanApiKey);
    if (abi) {
      await writeFile(abiPath, JSON.stringify(abi), "utf-8");
      console.log(`ABI for ${jobAddress} saved to ${abiPath}`);
    } else {
      console.error(`Failed to fetch ABI for ${jobAddress}`);
      return undefined;
    }
  }

  for (const item of abi) {
    if (item.type == "event" && item.name == "Work") {
      const eventName = item.name;
      const paramsTypes = item.inputs.map((input: any) => input.type).join(",");
      const eventSignature = `${eventName}(${paramsTypes})`;
      console.log(eventSignature);
      return ethers.id(eventSignature);
    }
  }
  console.error(`Work event not found in ABI for  ${jobAddress}`);
  return undefined;
};
