global.fetch = jest.fn();
jest.mock("fs/promises", () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
}));
import {
  fetchContractABI,
  getWorkEventSignature,
} from "../../src/utils/etherscan";
import { readFile, writeFile } from "fs/promises";

describe("fetchContractABI", () => {
  it("should fetch the ABI of the specified contract", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        status: "1",
        message: "OK",
        result: JSON.stringify({ abi: "testABI" }),
      }),
    });
    const abi = await fetchContractABI("0x123", "testApiKey");
    expect(abi).toEqual({ abi: "testABI" });
  });

  it("should return null on API errors", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({
        status: "0",
        message: "Error",
      }),
    });
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const abi = await fetchContractABI("0x123", "testApiKey");
    expect(abi).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(expect.any(String));
    consoleSpy.mockRestore();
  });
});

describe("getWorkEventSignature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns the Work event signature hash when ABI is locally available", async () => {
    (readFile as jest.Mock).mockResolvedValueOnce(
      JSON.stringify([
        {
          type: "event",
          name: "Work",
          inputs: [
            { type: "bytes32", name: "param1" },
            { type: "address", name: "param2" },
          ],
        },
      ])
    );

    const signature = await getWorkEventSignature(
      "0xJobAddress",
      "myEtherscanApiKey"
    );

    expect(readFile).toHaveBeenCalledWith(expect.any(String), "utf8");
    expect(signature).toBeDefined();
    expect(signature).toEqual(expect.any(String));
  });

  it("fetches ABI from Etherscan and saves it if local ABI is not found", async () => {
    (readFile as jest.Mock).mockRejectedValueOnce(new Error("File not found"));
    (fetch as jest.Mock).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          status: "1",
          message: "OK",
          result: JSON.stringify([
            {
              type: "event",
              name: "Work",
              inputs: [{ type: "bytes32", name: "param1" }],
            },
          ]),
        })
      )
    );
    (writeFile as jest.Mock).mockResolvedValueOnce(undefined);

    const signature = await getWorkEventSignature(
      "0xJobAddress",
      "myEtherscanApiKey"
    );

    expect(fetch).toHaveBeenCalledWith(expect.any(String));
    expect(writeFile).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      "utf-8"
    );
    expect(signature).toBeDefined();
    expect(signature).toEqual(expect.any(String));
  });
});
