"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
global.fetch = jest.fn();
jest.mock("fs/promises", () => ({
    readFile: jest.fn(),
    writeFile: jest.fn(),
}));
const etherscan_1 = require("../../src/utils/etherscan");
const promises_1 = require("fs/promises");
describe("fetchContractABI", () => {
    it("should fetch the ABI of the specified contract", async () => {
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                status: "1",
                message: "OK",
                result: JSON.stringify({ abi: "testABI" }),
            }),
        });
        const abi = await (0, etherscan_1.fetchContractABI)("0x123", "testApiKey");
        expect(abi).toEqual({ abi: "testABI" });
    });
    it("should return null on API errors", async () => {
        fetch.mockResolvedValueOnce({
            json: jest.fn().mockResolvedValueOnce({
                status: "0",
                message: "Error",
            }),
        });
        const consoleSpy = jest.spyOn(console, "error").mockImplementation();
        const abi = await (0, etherscan_1.fetchContractABI)("0x123", "testApiKey");
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
        promises_1.readFile.mockResolvedValueOnce(JSON.stringify([
            {
                type: "event",
                name: "Work",
                inputs: [
                    { type: "bytes32", name: "param1" },
                    { type: "address", name: "param2" },
                ],
            },
        ]));
        const signature = await (0, etherscan_1.getWorkEventSignature)("0xJobAddress", "myEtherscanApiKey");
        expect(promises_1.readFile).toHaveBeenCalledWith(expect.any(String), "utf8");
        expect(signature).toBeDefined();
        expect(signature).toEqual(expect.any(String));
    });
    it("fetches ABI from Etherscan and saves it if local ABI is not found", async () => {
        promises_1.readFile.mockRejectedValueOnce(new Error("File not found"));
        fetch.mockResolvedValueOnce(new Response(JSON.stringify({
            status: "1",
            message: "OK",
            result: JSON.stringify([
                {
                    type: "event",
                    name: "Work",
                    inputs: [{ type: "bytes32", name: "param1" }],
                },
            ]),
        })));
        promises_1.writeFile.mockResolvedValueOnce(undefined);
        const signature = await (0, etherscan_1.getWorkEventSignature)("0xJobAddress", "myEtherscanApiKey");
        expect(fetch).toHaveBeenCalledWith(expect.any(String));
        expect(promises_1.writeFile).toHaveBeenCalledWith(expect.any(String), expect.any(String), "utf-8");
        expect(signature).toBeDefined();
        expect(signature).toEqual(expect.any(String));
    });
});
