"use client";
import {
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  createMintToCheckedInstruction,
  getAssociatedTokenAddress,
  getMint,
} from "@solana/spl-token";
import {
  CldUploadWidget,
  CloudinaryUploadWidgetResults,
} from "next-cloudinary";
import { UploadApiResponse } from "cloudinary";
import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { PhotoIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { Switch } from "@headlessui/react";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import axios from "axios";
import AlertNotification from "./AlertNotification";
import {
  generateSigner,
  signerIdentity,
  createSignerFromKeypair,
  percentAmount,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  TokenStandard,
  createAndMint,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { mplCandyMachine } from "@metaplex-foundation/mpl-candy-machine";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";

interface MintPageProps {
  secretKey: string | undefined;
}

function classNames(...classes: (string | undefined | null | false | 0)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function TokenGenerator({ secretKey }: MintPageProps) {
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    decimals: "",
    supply: "",
    description: "",
    image: null as File | null,
    quantum_key_name: "",
  });

  const [enabled, setEnabled] = useState(false); // State for the switch
  const [open, setOpen] = useState(false); // State for the dialog
  // State variable to manage NFT mode
  const [nftMode, setNftMode] = useState(false);
  const [imageURL, setImageURL] = useState("");
  const [metadataURL, setMetadataURL] = useState("");

  // Function to handle toggling NFT mode
  const toggleNftMode = () => {
    setNftMode(!nftMode);
  };

  // Function to handle toggling of the switch
  const handleToggle = (value: boolean) => {
    setEnabled(value); // Update the state based on the toggle value
    // If switch is enabled, open the dialog
    if (value) setOpen(true);
  };

  // Function to handle closing of the dialog
  const handleCloseDialog = () => {
    setOpen(false);
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLInputElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setFormData((prevState) => ({
        ...prevState,
        image: file,
      }));
    }
  };

  const [showError, setShowError] = useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Check if the switch is enabled
    if (enabled) {
      try {
        // Encrypt the data and send the request
        const response = await axios.post(
          "http://localhost:5000/encrypt",
          formData
        ); // Updated endpoint
        console.log(response.data);
      } catch (error) {
        console.error("Error creating token:", error);
        setShowError(true);
      }
    } else {
      console.log("Switch is not enabled. Data will not be encrypted.");
      // You might want to handle this case depending on your requirements
    }
  };

  // Import your private key file and parse it.
  const { connection } = useConnection();
  const wallet = useWallet();
  console.log(`Wallet Account: ${wallet.publicKey?.toBase58()}`);

  const umi = createUmi(connection)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())
    // Register Wallet Adapter to Umi
    .use(walletAdapterIdentity(wallet));

  async function TokenGenerator() {
    if (!wallet.publicKey || !wallet.signTransaction) {
      throw new WalletNotConnectedError();
    } else {
      await createJSON();

      let tokenstandard = TokenStandard.Fungible;
      if (nftMode) {
        tokenstandard = TokenStandard.NonFungible;
        formData.decimals = "0";
        formData.supply = "1";
      }

      const mint = generateSigner(umi);
      console.log(
        "the data before createAndMint runs: ",
        metadataURL,
        formData.name,
        formData.symbol,
        formData.decimals,
        formData.supply
      );
      createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: formData.name,
        symbol: formData.symbol,
        uri: metadataURL,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: parseInt(formData.decimals),
        amount: parseInt(formData.supply),
        // @ts-ignore
        tokenOwner: wallet.publicKey,
        tokenStandard: tokenstandard,
      })
        .sendAndConfirm(umi)
        .then(() => {
          console.log("Successfully minted token (", mint.publicKey, ")");
        });
    }
  }

  const handleImageUploaded = (result: CloudinaryUploadWidgetResults) => {
    console.log("image uploaded");
    //@ts-ignore
    setImageURL(result.info.secure_url);
  };

  async function createJSON() {
    console.log(
      "name is: ",
      formData.name,
      "symbol is: ",
      formData.symbol,
      "desc is: ",
      formData.description,
      "imageURL is: ",
      imageURL
    );
    const jsonData = {
      name: formData.name,
      symbol: formData.symbol,
      description: formData.description,
      image: imageURL,
    };

    fetch("/api/token/save-json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to save JSON data");
        }
        return response.json();
      })
      .then((data) => {
        console.log("JSON data saved onto cloudinary", data);
        setMetadataURL(data.result.secure_url);
      })
      .catch((error) => {
        console.error("Error saving JSON data:", error);
      });
  }

  return (
    <div className="space-y-10 divide-y divide-gray-900/10 p-10">
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 pt-10 md:grid-cols-3">
        <div className="px-4 sm:px-0">
          <h2 className="text-base font-semibold leading-7 text-gray-900">
            Aires A.T.
          </h2>
          <p className="mt-1 text-sm leading-6 text-gray-600">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed ac nisi
            eu augue eleifend sagittis. Nam at sollicitudin odio, eu placerat
            sapien. Vestibulum ante ipsum primis in faucibus orci luctus et
            ultrices posuere cubilia curae; Integer quis ipsum purus. Aenean et
            massa bibendum, condimentum neque in, tincidunt odio. Nullam lorem
            nunc, rhoncus vitae erat et, ullamcorper placerat libero.
          </p>
        </div>

        <form
          className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2"
          onSubmit={handleSubmit}
        >
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label
                  htmlFor="name"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    autoComplete="UncleRingoToken"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="symbol"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Symbols
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="symbol"
                    id="symbol"
                    autoComplete="Ringo"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    value={formData.symbol}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="decimal"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Decimal
                </label>
                <div className="mt-2">
                  <input
                    id="decimals"
                    type="number"
                    name="decimals"
                    autoComplete="9"
                    min="0"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    value={formData.decimals}
                    onChange={handleChange}
                    placeholder={nftMode ? "0" : ""}
                    disabled={nftMode}
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label
                  htmlFor="supply"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Supply
                </label>
                <div className="mt-2">
                  <input
                    id="supply"
                    type="number"
                    name="supply"
                    min="1"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    value={formData.supply}
                    onChange={handleChange}
                    placeholder={nftMode ? "1" : ""}
                    disabled={nftMode}
                  />
                </div>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Description
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="description"
                    id="description"
                    autoComplete="Uncle Ringo Token Designed By Aires Applied Technology"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="flex items-center">
                {/* Label for the switch */}
                <label className="mr-5 block text-sm font-medium leading-6 text-gray-900">
                  Encrypt Description
                </label>

                {/* Switch component */}
                <Switch
                  checked={enabled}
                  onChange={handleToggle}
                  className={classNames(
                    enabled ? "bg-red-600" : "bg-gray-200",
                    "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                  )}
                >
                  <span className="sr-only">Use setting</span>
                  <span
                    aria-hidden="true"
                    className={classNames(
                      enabled ? "translate-x-5" : "translate-x-0",
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    )}
                  />
                </Switch>

                {/* Dialog component */}
                <Transition.Root show={open} as={Fragment}>
                  <Dialog
                    as="div"
                    className="fixed inset-0 overflow-y-auto"
                    onClose={handleCloseDialog}
                  >
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Dialog.Overlay className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
                      </Transition.Child>

                      <span
                        className="hidden sm:inline-block sm:align-middle sm:h-screen"
                        aria-hidden="true"
                      >
                        &#8203;
                      </span>

                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                      >
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                          {/* Your dialog content */}
                          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                              <CheckIcon
                                className="h-6 w-6 text-green-600"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="mt-3 text-center sm:mt-5">
                              <Dialog.Title
                                as="h3"
                                className="text-lg leading-6 font-medium text-gray-900"
                              >
                                Encryption Set Up
                              </Dialog.Title>
                              <div className="mt-2">
                                <div className="sm:col-span-3">
                                  <label
                                    htmlFor="quantum_key_name"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                  >
                                    Quantum Key Name
                                  </label>
                                  <div className="mt-2">
                                    <input
                                      id="quantum_key_name"
                                      type="text"
                                      name="quantum_key_name"
                                      placeholder="Quantum Key Name"
                                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                                      onChange={handleChange}
                                    />
                                  </div>
                                </div>

                                <div className="sm:col-span-3">
                                  <label
                                    htmlFor="username"
                                    className="block text-sm font-medium leading-6 text-gray-900"
                                  >
                                    Username
                                  </label>
                                  <div className="mt-2">
                                    <input
                                      id="username"
                                      type="text"
                                      name="username"
                                      placeholder="Username"
                                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                                      onChange={handleChange}
                                    />
                                  </div>

                                  <div className="sm:col-span-3">
                                    <label
                                      htmlFor="keysize"
                                      className="block text-sm font-medium leading-6 text-gray-900"
                                    >
                                      Key Size
                                    </label>
                                    <div className="mt-2">
                                      <input
                                        id="keysize"
                                        type="number"
                                        name="keysize"
                                        placeholder="Key Size"
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                                        min="5800"
                                        onChange={handleChange}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                              type="button"
                              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                              onClick={handleCloseDialog}
                            >
                              Done
                            </button>
                          </div>
                        </div>
                      </Transition.Child>
                    </div>
                  </Dialog>
                </Transition.Root>

                {/* Second button group */}
                <div className="flex items-center ml-5">
                  <Switch.Group as="div" className="flex items-center">
                    <Switch.Label as="span" className="mr-3 text-sm">
                      <span className="font-medium text-gray-900">
                        {nftMode ? "Non-Fungible Token" : "Fungible Token"}
                      </span>
                    </Switch.Label>
                    <Switch
                      checked={nftMode}
                      onChange={toggleNftMode}
                      className={classNames(
                        nftMode ? "bg-red-600" : "bg-gray-200",
                        "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2"
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          nftMode ? "translate-x-5" : "translate-x-0",
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        )}
                      />
                    </Switch>
                  </Switch.Group>
                </div>
              </div>

              <div className="col-span-full">
                <label
                  htmlFor="iamge"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Image
                </label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  <div className="text-center">
                    <CldUploadWidget
                      uploadPreset="jmnzgawq"
                      onSuccess={(result) => handleImageUploaded(result)}
                    >
                      {({ open }) => {
                        return (
                          <button onClick={() => open()}>
                            Upload an Image
                          </button>
                        );
                      }}
                    </CldUploadWidget>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              type="button"
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Clear
            </button>
            <button
              type="submit"
              onClick={TokenGenerator}
              className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
      {/* Render AlertNotification component conditionally */}
      {showError && (
        <AlertNotification showError={showError} setShowError={setShowError} />
      )}
    </div>
  );
}
