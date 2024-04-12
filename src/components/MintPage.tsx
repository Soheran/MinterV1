"use client";
import { useMemo } from "react";
import { clusterApiUrl } from "@solana/web3.js";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import {
  WalletModalProvider,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import "@solana/wallet-adapter-react-ui/styles.css";
import { useState } from "react";
import { Dialog } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import { useWallet } from "@solana/wallet-adapter-react";
import MintToken from "./MintToken";
import Generator from "./Generator";
// import Encryption from "./Encryption";
import MintNFT from "./MintNFT";
import HomePage from "./HomePage";
import Image from "next/image";

interface MintPageProps {
  secretKey: string | undefined;
}
const WalletConnect: React.FC<MintPageProps> = ({ secretKey }) => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const network = WalletAdapterNetwork.Devnet;
  const wallet = useWallet();
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
  const wallets = useMemo(() => [new PhantomWalletAdapter()], [network]);

  const [activeTab, setActiveTab] = useState("HomePage");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Check if the entered password is correct
    if (password === "aires") {
      setAuthenticated(true);
    } else {
      alert("Incorrect password. Please try again.");
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleItemClick = (itemName: string) => {
    setActiveTab(itemName);
    setMobileMenuOpen(false);
  };

  const navigation = [
    {
      name: "Generator",
      onClick: () => handleItemClick("Generator"),
    },
    { name: "Mint Token", onClick: () => handleItemClick("Mint Token") },
    // { name: "NFT Generator", onClick: () => handleItemClick("NFT Generator") },
    { name: "Mint NFT", onClick: () => handleItemClick("Mint NFT") },
    // { name: "Encryption", onClick: () => handleItemClick("Encryption") },
  ];

  return (
    <>
      {!authenticated && (
        <div className="password-popup">
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="submit">Submit</button>
          </form>
        </div>
      )}
      {authenticated && (
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets}>
            <WalletModalProvider>
              <header className="bg-white">
                <nav
                  className="flex items-center justify-between p-6 lg:px-8"
                  aria-label="Global"
                >
                  <div className="flex lg:flex-1">
                    <a href="#" className="-m-1.5 p-1.5">
                      <span className="sr-only">Aires A.T.</span>
                      <img
                        className="h-8 w-auto"
                        src="https://images.squarespace-cdn.com/content/v1/613aa4d54eebce178a4c3431/df1cbc1a-e5d0-4366-ab81-046c0c4a9eec/A_A.T_Main_Logo_2000x1500_2-removebg-preview.png"
                        alt=""
                      />
                    </a>
                  </div>
                  <div className="flex lg:hidden">
                    <button
                      type="button"
                      className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                      onClick={() => setMobileMenuOpen(true)}
                    >
                      <span className="sr-only">Open main menu</span>
                      <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="hidden lg:flex lg:gap-x-12">
                    {navigation.map((item, index) => (
                      <button
                        key={index}
                        className={`text-sm font-semibold leading-6 text-gray-900 hover:text-red-500 ${
                          activeTab === item.name ? "text-red-500" : ""
                        }`}
                        onClick={item.onClick}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                  <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                    <a
                      href="#"
                      className="text-sm font-semibold leading-6 text-gray-900"
                    >
                      <WalletMultiButton />
                    </a>
                  </div>
                </nav>
                <Dialog
                  as="div"
                  className="lg:hidden"
                  open={mobileMenuOpen}
                  onClose={setMobileMenuOpen}
                >
                  <div className="fixed inset-0 z-10" />
                  <Dialog.Panel className="fixed inset-y-0 right-0 z-10 w-full overflow-y-auto bg-white px-6 py-6 sm:max-w-sm sm:ring-1 sm:ring-gray-900/10">
                    <div className="flex items-center justify-between">
                      <a href="#" className="-m-1.5 p-1.5">
                        <span className="sr-only">Uncle Ringo</span>
                        <img
                          className="h-8 w-auto"
                          src="https://scontent.fsin11-1.fna.fbcdn.net/v/t39.30808-6/327161498_1281712586109510_9027727457607388738_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=5f2048&_nc_ohc=Pe_sdZnaRwYAX8jn-2G&_nc_ht=scontent.fsin11-1.fna&oh=00_AfAG9p782eBGGSYUM7A35cdtjwFXLXeJiV4q7stfJdlBqw&oe=66116B82"
                          alt=""
                        />
                      </a>
                      <button
                        type="button"
                        className="-m-2.5 rounded-md p-2.5 text-gray-700"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="sr-only">Close menu</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="mt-6 flow-root">
                      <div className="-my-6 divide-y divide-gray-500/10">
                        <div className="space-y-2 py-6">
                          {navigation.map((item, index) => (
                            <button
                              key={index}
                              className={`-mx-3 block rounded-lg px-3 py-2 text-base font-semibold leading-7 text-gray-900 hover:bg-red-500 ${
                                activeTab === item.name ? "text-red-500" : ""
                              }`}
                              onClick={item.onClick}
                            >
                              {item.name}
                            </button>
                          ))}
                        </div>
                        <div className="py-6">
                          <a
                            href="#"
                            className="-mx-3 block rounded-lg px-3 py-2.5 text-base font-semibold leading-7 text-gray-900 hover:bg-gray-50"
                          >
                            <WalletMultiButton />
                          </a>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Dialog>
                {/* Render corresponding components based on activeTab */}
                {activeTab === "HomePage" && <HomePage />}
                {activeTab === "Generator" && (
                  <Generator secretKey={secretKey} />
                )}
                {activeTab === "Mint Token" && (
                  <MintToken secretKey={secretKey} />
                )}
                {/* {activeTab === "NFT Generator"} */}
                {activeTab === "Mint NFT" && <MintNFT secretKey={secretKey} />}
                {/* {activeTab === "Encryption" && <Encryption />} */}
              </header>
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      )}
    </>
  );
};

export default WalletConnect;
