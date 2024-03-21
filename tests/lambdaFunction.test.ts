global.fetch = jest.fn();
// Mock only the JsonRpcProvider and Contract
const getBlockNumberMock = jest.fn().mockResolvedValue(100);
let getLogsMock = jest.fn().mockResolvedValue([]);
jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");

  return {
    ...originalModule,
    ethers: {
      ...originalModule.ethers,
      JsonRpcProvider: jest.fn().mockImplementation((rpcURL) => ({
        getBlockNumber: getBlockNumberMock,
        getLogs: getLogsMock,
      })),
      Contract: jest.fn().mockImplementation((address, abi, provider) => ({
        numJobs: jest.fn().mockResolvedValue(7),
        jobAt: jest
          .fn()
          .mockImplementation((index) => `0xMockJobAddress${index}`),
      })),
    },
    __mocks: {
        getBlockNumberMock,
        getLogsMock,
      },
  };
});
jest.mock("../src/utils/alerts", () => ({
  sendAlert: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../src/utils/etherscan", () => ({
  getWorkEventSignature: jest.fn().mockResolvedValue("0xMockJobAddress"),
}));
import { handler } from "../src/lambdaFunction";
import { sendAlert } from "../src/utils/alerts";
import { ethers } from "ethers";

describe("handler function", () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Reset mocks before each test
  });
  it("should send an alert if no work was done", async () => {
    // Assuming sendAlert and ethers mocks are correctly set up
    await handler();
    expect(sendAlert).toHaveBeenCalled();
    expect(ethers.JsonRpcProvider).toHaveBeenCalled();
    expect(getBlockNumberMock).toHaveBeenCalled();
    expect(getLogsMock).toHaveBeenCalledTimes(7);
  });
  it("should not send an alert if work was done", async () => {
    getLogsMock = jest.fn().mockResolvedValue(['a']);
    await handler();
    expect(sendAlert).toHaveBeenCalledTimes(0);
  })
});
