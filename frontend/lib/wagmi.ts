import { createConfig, http } from "wagmi";
import { XLAYER_TESTNET, XLAYER_MAINNET } from "./contracts";

export const config = createConfig({
  chains: [XLAYER_TESTNET, XLAYER_MAINNET],
  connectors: [],
  transports: {
    [XLAYER_TESTNET.id]: http(XLAYER_TESTNET.rpcUrls.default.http[0]),
    [XLAYER_MAINNET.id]: http(XLAYER_MAINNET.rpcUrls.default.http[0]),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
