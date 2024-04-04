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

function NFTminting({ secretKey }: MintPageProps) {
  // Change this to yours
  const collectionMintAddress = "7QSVNJSex9giRdhuuaYHZA9ikUE2L4c2n1PKz3PHS7iZ";
  const candyMachineAddress = "HMjsU7TcfEtgsAiSa5NHwRDVapbV9F5mBBqP3nGiwJ1o";

  const [isOpen, setIsOpen] = useState(false);
  const [assetData, setAssetData] = useState<DigitalAsset | null>(null);
  const [imageUri, setImageUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <>
      <div>
        Mint Token Section
        <div>
          <button onClick={mintNft}>mint nft</button>
        </div>
        {isLoading && (
          <div className="loading-screen">
            <p>Loading...</p>
            {/* You can add additional loading indicators here */}
          </div>
        )}
        <div>
          <Modal
            isOpen={isOpen}
            onRequestClose={() => setIsOpen(false)}
            style={{
              content: {
                width: "30rem",
                height: "32rem",
                display: "flex",
                flexDirection: "column",
              },
            }}
          >
            <button className="close-button" onClick={() => setIsOpen(false)}>
              X
            </button>
            <div className="container-modal">
              <div className="title">NFT Minted Successfully!</div>
              {assetData && (
                <h3 className="data">NFT Name: {assetData.metadata.name}</h3>
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
              <div className="data">
                <button onClick={() => setIsOpen(false)}>close</button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    </>
  );
}

interface MintPageProps {
  secretKey: string | undefined;
}

export default NFTminting;
