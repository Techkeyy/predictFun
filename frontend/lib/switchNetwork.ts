export const XLAYER_TESTNET_PARAMS = {
  chainId: "0x790",
  chainName: "X Layer Testnet",
  nativeCurrency: {
    name: "OKB",
    symbol: "OKB",
    decimals: 18,
  },
  rpcUrls: ["https://testrpc.xlayer.tech/terigon"],
  blockExplorerUrls: ["https://www.okx.com/web3/explorer/xlayer-test"],
};

export async function switchToXLayerTestnet(): Promise<boolean> {
  if (typeof window === "undefined" || !(window as any).ethereum) return false;
  const eth = (window as any).ethereum;
  try {
    await eth.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x790" }],
    });
    return true;
  } catch (err: any) {
    if (err.code === 4902) {
      try {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [XLAYER_TESTNET_PARAMS],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
