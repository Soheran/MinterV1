"use client";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  mplCandyMachine,
  fetchCandyMachine,
  fetchCandyGuard,
  create,
  addConfigLines,
  updateCandyGuard,
  mintV2,
  deleteCandyMachine,
} from "@metaplex-foundation/mpl-candy-machine";
import {
  publicKey,
  generateSigner,
  percentAmount,
  some,
  sol,
  transactionBuilder,
} from "@metaplex-foundation/umi";
import {
  createNft,
  DigitalAsset,
  fetchDigitalAsset,
  mplTokenMetadata,
  TokenStandard,
} from "@metaplex-foundation/mpl-token-metadata";
import { setComputeUnitLimit } from "@metaplex-foundation/mpl-toolbox";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { Keypair } from "@solana/web3.js";
import { useState } from "react";
import Modal from "react-modal";
import "./styles.css";
import { Tab } from "@headlessui/react";
import { StarIcon } from "@heroicons/react/20/solid";
import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";

interface MintPageProps {
  secretKey: string | undefined;
}

interface Product {
  name: string;
  price: string;
  rating: number;
  images: { id: number; name: string; src: string; alt: string }[];
  description: string;
}

const product: Product = {
  name: "Pokemon Collection",
  price: "$10",
  rating: 5,
  images: [
    {
      id: 1,
      name: "Ringo NFT",
      src: "https://wallpapers-clan.com/wp-content/uploads/2023/11/cute-pokemon-pikachu-rain-desktop-wallpaper-preview.jpg",
      alt: "Uncle Ringo NFT Collection",
    },
  ],

  description: `
    <p>Example pokemon collection for testing purposes. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin consectetur auctor dolor vel semper. Donec eleifend diam eget enim lobortis, non auctor dolor tincidunt. Nam euismod, dui a ultrices ullamcorper, sem nisl tincidunt turpis, placerat consequat libero metus ac quam. Mauris vitae sem faucibus, consequat lorem eget, faucibus purus.</p>
  `,
};

function classNames(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function NFTminting({ secretKey }: MintPageProps) {
  // Update env for this
  // Change this to yours
  const collectionMintAddress =
    process.env.CollectionMintAddress ||
    "9yjYUJ2rfXcuPadG51vDF5Zvnqzg8g87PCxFG7WK66QC";
  const candyMachineAddress =
    process.env.CandyMachineAddress ||
    "HDS6FLM572tzCbgPtf7mgcSwRiH2uDB3yHphGoFDn4Za";

  const [isOpen, setIsOpen] = useState(false);
  const [assetData, setAssetData] = useState<DigitalAsset | null>(null);
  const [imageUri, setImageUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(true);
  const [countTotal, setCountTotal] = useState<number>(0);
  const [countRemaining, setCountRemaining] = useState<number>(0);
  const [countMinted, setCountMinted] = useState<number>(0);
  const [mintDisabled, setMintDisabled] = useState<boolean>(true);
  // Import your private key file and parse it.
  const { connection } = useConnection();
  const wallet = useWallet();
  console.log(`Wallet Account: ${wallet.publicKey?.toBase58()}`);

  const umi = createUmi(connection)
    .use(mplTokenMetadata())
    .use(mplCandyMachine())
    // Register Wallet Adapter to Umi
    .use(walletAdapterIdentity(wallet));

  //set nft owner keypair
  let numberArray: number[] = [];
  if (secretKey !== undefined) {
    numberArray = JSON.parse(secretKey);
    console.log("sk found");
  } else {
    console.log("Secret key is undefined.");
  }
  const SK = new Uint8Array(numberArray);
  const fromWallet = Keypair.fromSecretKey(SK);
  console.log(fromWallet.publicKey.toBase58());

  // Create the Collection NFT.
  async function createCollectionNft() {
    const collectionMint = generateSigner(umi);
    console.log("collectionMint: ", collectionMint);
    await createNft(umi, {
      mint: collectionMint,
      authority: umi.identity,
      name: "Testing Collection for nfts 2",
      symbol: "RCO",
      uri: "https://res.cloudinary.com/db9aqguwu/raw/upload/v1712034516/collection1_sxbryq.json",
      sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
      isCollection: true,
    }).sendAndConfirm(umi);

    // Create the Candy Machine.
    const candyMachine = generateSigner(umi);
    console.log("candyMachine: ", candyMachine);
    const createCandyMachineTransaction = await create(umi, {
      candyMachine,
      collectionMint: collectionMint.publicKey,
      collectionUpdateAuthority: umi.identity,
      tokenStandard: TokenStandard.NonFungible,
      sellerFeeBasisPoints: percentAmount(9.99, 2), // 9.99%
      itemsAvailable: 3,
      creators: [
        {
          address: umi.identity.publicKey,
          verified: true,
          percentageShare: 100,
        },
      ],
      configLineSettings: some({
        prefixName: "",
        nameLength: 32,
        prefixUri: "",
        uriLength: 200,
        isSequential: false,
      }),
      guards: {
        mintLimit: some({ id: 1, limit: 1 }),
      },
    });

    // Wait for the transaction to be confirmed
    await createCandyMachineTransaction.sendAndConfirm(umi);
  }

  async function getCM() {
    let candyMachineAddr = publicKey(candyMachineAddress);
    const candyMachine = await fetchCandyMachine(umi, candyMachineAddr);
    const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

    console.log(candyMachine);
    console.log(candyGuard);
    // console.log(candyGuard.guards.mintLimit);
    // console.log(candyGuard.guards.solPayment);
  }

  async function insertItems() {
    let candyMachineAddr = publicKey(candyMachineAddress);
    const candyMachine = await fetchCandyMachine(umi, candyMachineAddr);

    await addConfigLines(umi, {
      candyMachine: candyMachine.publicKey,
      index: 0,
      configLines: [
        {
          name: "meme1",
          uri: "https://raw.githubusercontent.com/Soheran/uploaded/main/meme1.json",
        },
        {
          name: "meme2",
          uri: "https://raw.githubusercontent.com/Soheran/uploaded/main/meme2.json",
        },
        {
          name: "meme3",
          uri: "https://raw.githubusercontent.com/Soheran/uploaded/main/meme3.json",
        },
      ],
    }).sendAndConfirm(umi);
  }

  async function updateGuard() {
    let candyMachineAddr = publicKey(candyMachineAddress);
    const candyMachine = await fetchCandyMachine(umi, candyMachineAddr);
    const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

    await updateCandyGuard(umi, {
      candyGuard: candyGuard.publicKey,
      guards: {
        ...candyGuard.guards,
        botTax: some({ lamports: sol(0.01), lastInstruction: true }),
        mintLimit: some({ id: 1, limit: 1 }),
        solPayment: some({
          lamports: sol(0.01),
          destination: umi.identity.publicKey,
        }),
      },
      groups: [],
    }).sendAndConfirm(umi);

    getCM();
  }

  async function mintNft() {
    let candyMachineAddr = publicKey(candyMachineAddress);
    let collectionNft = publicKey(collectionMintAddress);
    const candyMachine = await fetchCandyMachine(umi, candyMachineAddr);
    const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);
    console.log(candyMachine);
    console.log(candyGuard);

    const nftMint = generateSigner(umi);
    console.log("nftMint: ", nftMint);

    const signature = await transactionBuilder()
      .add(setComputeUnitLimit(umi, { units: 800_000 }))
      .add(
        mintV2(umi, {
          candyMachine: candyMachine.publicKey,
          nftMint,
          collectionMint: collectionNft,
          // @ts-ignore
          collectionUpdateAuthority: fromWallet.publicKey,
          tokenStandard: candyMachine.tokenStandard,
          mintArgs: {
            mintLimit: some({ id: 1 }),
          },
        })
      )
      .sendAndConfirm(umi);

    if (signature) {
      console.log(
        "Successfully minted nft, the transaction signature is: ",
        signature
      );

      getAsset(nftMint.publicKey);
    }
  }

  async function deleteCM() {
    let candyMachineAddr = publicKey(candyMachineAddress);
    await deleteCandyMachine(umi, {
      candyMachine: candyMachineAddr,
    }).sendAndConfirm(umi);
  }

  async function getAsset(pk: string) {
    setIsLoading(true);
    // let pk1 = "EaFvZnr1bPzeD6iZ7rAwJR9x8b8KLz3Mv6eHv2YnMMx4";
    let mint = publicKey(pk);
    const asset = await fetchDigitalAsset(umi, mint);
    console.log(asset);
    setAssetData(asset);
    fetchNFTimage(asset.metadata.uri);
    setIsOpen(true);
  }

  function fetchNFTimage(link: string) {
    fetch(link)
      .then((response) => response.json())
      .then((data) => {
        // Handle the fetched data
        console.log(data);
        setImageUri(data.image);
      })
      .catch((error) => {
        // Handle errors
        console.error("Error fetching metadata:", error);
      });
  }

  useEffect(() => {
    const fetchData = async () => {
      let candyMachineAddr = publicKey(candyMachineAddress);
      const candyMachine = await fetchCandyMachine(umi, candyMachineAddr);
      const candyGuard = await fetchCandyGuard(umi, candyMachine.mintAuthority);

      const total = candyMachine.itemsLoaded;
      const minted = Number(candyMachine.itemsRedeemed);
      const remaining = total - minted;

      setCountTotal(total);
      setCountMinted(minted);
      setCountRemaining(remaining);
    };

    fetchData();
  }, []);

  // Determine color based on countRemaining
  let colorClass = "";
  if (countRemaining === 0) {
    colorClass = "bg-red-600";
  } else if (countRemaining < countTotal / 2) {
    colorClass = "bg-yellow-500";
  } else {
    colorClass = "bg-green-600";
  }

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
          {/* Image gallery */}
          <Tab.Group as="div" className="flex flex-col-reverse">
            <Tab.Panels className="aspect-h-1 aspect-w-1 w-full">
              {product.images.map((image) => (
                <Tab.Panel key={image.id}>
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="h-full w-full object-cover object-center sm:rounded-lg"
                  />
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </Tab.Group>

          {/* Product info */}
          <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {product.name}
            </h1>

            <div className="mt-3">
              <h2 className="sr-only">Product information</h2>
              <p className="text-3xl tracking-tight text-gray-900">
                {product.price}
              </p>
            </div>

            {/* Reviews */}
            <div className="mt-3">
              <h3 className="sr-only">Reviews</h3>
              <div className="flex items-center">
                <div className="flex items-center">
                  {[0, 1, 2, 3, 4].map((rating) => (
                    <StarIcon
                      key={rating}
                      className={classNames(
                        product.rating > rating
                          ? "text-red-500"
                          : "text-gray-300",
                        "h-5 w-5 flex-shrink-0"
                      )}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <p className="sr-only">{product.rating} out of 5 stars</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="sr-only">Description</h3>

              <div
                className="space-y-6 text-base text-gray-700"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-between">
              <div className="mt-10 flex flex-1 px-4">
                <button
                  type="submit"
                  className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-red-600 px-8 py-3 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                  onClick={mintNft}
                >
                  Mint NFT
                </button>
                <Transition.Root show={isOpen} as={Fragment}>
                  <Dialog
                    as="div"
                    className="fixed inset-0 overflow-y-auto"
                    onClose={() => setIsOpen(false)}
                  >
                    <div className="flex items-center justify-center min-h-screen">
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

                      <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                        enterTo="opacity-100 translate-y-0 sm:scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                        leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                      >
                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                          <div className="p-8">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                              <CheckIcon
                                className="h-6 w-6 text-green-600"
                                aria-hidden="true"
                              />
                            </div>
                            <div className="mt-3 text-center sm:mt-5">
                              <Dialog.Title
                                as="h3"
                                className="text-lg font-semibold leading-6 text-gray-900"
                              >
                                NFT Minted Successfully!
                              </Dialog.Title>
                              <div className="mt-2">
                                {assetData && (
                                  <h3 className="data">
                                    NFT Name: {assetData.metadata.name}
                                  </h3>
                                )}
                                {assetData && (
                                  <h3 className="data">
                                    NFT Symbol:{" "}
                                    {assetData.metadata.symbol
                                      ? assetData.metadata.symbol
                                      : "Undefined"}
                                  </h3>
                                )}
                                <div style={{ textAlign: "center" }}>
                                  {imageUri && (
                                    <img
                                      src={imageUri}
                                      alt="NFT Image"
                                      style={{ display: "inline-block" }}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
                            <button
                              type="button"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                              onClick={() => setIsOpen(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </Transition.Child>
                    </div>
                  </Dialog>
                </Transition.Root>
              </div>
              <div
                className={`mt-10 flex flex-1 items-center justify-center rounded-md border border-transparent ${colorClass} px-8 py-3 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full`}
              >
                <p>
                  {countRemaining}/{countTotal}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoading && (
        <div className="loading-screen">
          <p>Loading...</p>
          {/* You can add additional loading indicators here */}
        </div>
      )}
    </div>
  );
}
