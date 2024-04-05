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
import { useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";

interface MintPageProps {
  secretKey: string | undefined;
}

const stats = [
  { label: "Assets under holding", value: "$119 trillion" },
  { label: "New users annually", value: "46,000" },
];

export default function MintToken({ secretKey }: MintPageProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  console.log(`Wallet Account: ${wallet.publicKey?.toBase58()}`);

  const tokenMint = "EZ434K66Bz8UWPGp1Bok9QPeLrqDiqRrBoX727yxg7Vp";
  const tokenMintPublicKey = new PublicKey(tokenMint);

  const [mintAmount, setMintAmount] = useState(100);
  const decimals = 0;
  const numberPerToken = 1;

  //set wallet keypair
  let numberArray: number[] = [];
  if (secretKey !== undefined) {
    numberArray = JSON.parse(secretKey);
    console.log("Secret key is found");
  } else {
    console.log("Secret key is undefined.");
  }
  const SK = new Uint8Array(numberArray);
  const fromWallet = Keypair.fromSecretKey(SK);

  const mintMoreToken = async () => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new WalletNotConnectedError();
      }

      const associatedAccount = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        wallet.publicKey
      );

      console.log(
        `associatedAccount address: ${associatedAccount?.toBase58()}`
      );

      const associatedAccountInfo = await connection.getAccountInfo(
        associatedAccount
      );

      if (!associatedAccountInfo) {
        console.log("in !associatedAccountInfo");
        const createTokenAccountInstruction =
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            associatedAccount,
            wallet.publicKey,
            tokenMintPublicKey
          );

        const transaction = new Transaction().add(
          createTokenAccountInstruction
        );
        const blockHash = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockHash.blockhash;
        transaction.feePayer = wallet.publicKey;

        const signedTransaction = await wallet.signTransaction(transaction);

        const signature = await connection.sendRawTransaction(
          signedTransaction.serialize()
        );

        console.log("Transaction signature for createTokenAccount:", signature);
      }

      const mintingInstruction = createMintToCheckedInstruction(
        tokenMintPublicKey,
        associatedAccount,
        fromWallet.publicKey, // Use user1's associated account
        mintAmount * numberPerToken, // amount
        decimals // decimals
      );

      const transaction = new Transaction().add(mintingInstruction);

      // // Convert 1 SOL to lamports
      // const solAmount = 1;
      // const lamports = solAmount * 1000000000; // 1 SOL = 1,000,000,000 lamports

      // transaction.add(
      //   SystemProgram.transfer({
      //     fromPubkey: wallet.publicKey,
      //     toPubkey: fromWallet.publicKey,
      //     lamports,
      //   })
      // );

      const blockHash = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockHash.blockhash;
      transaction.feePayer = wallet.publicKey;

      const fromWalletSigner = {
        publicKey: fromWallet.publicKey,
        secretKey: fromWallet.secretKey,
      } as any;

      // // Send the signed transaction
      const signedTransaction = await wallet.signTransaction(transaction);
      signedTransaction.partialSign(fromWalletSigner);

      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize(),
        { skipPreflight: true } // Skip preflight check to allow sending transactions with partial signatures
      );

      console.log("Transaction signature for minting tokens:", signature);

      fetchBalances();
    } catch (error) {
      console.log(error);
    }
  };

  const [totalSupply, setTotalSupply] = useState(0);
  const [userBalance, setUserBalance] = useState(0);

  const fetchBalances = async () => {
    try {
      if (!wallet.publicKey || !wallet.signTransaction) {
        throw new Error("Wallet not connected");
      }

      // Fetch total supply
      const mintInfo = await getMint(connection, tokenMintPublicKey);
      const supplyBigInt = mintInfo.supply;
      const supplyNumber = Number(supplyBigInt / BigInt(numberPerToken));
      setTotalSupply(supplyNumber);

      // Fetch user's balance
      const associatedAccount = await getAssociatedTokenAddress(
        tokenMintPublicKey,
        wallet.publicKey
      );
      const associatedAccountInfo = await connection.getTokenAccountBalance(
        associatedAccount
      );
      const tokenCountString = associatedAccountInfo.value.amount;
      const tokenCount = Number(tokenCountString);
      const tokenNumber = Number(tokenCount / numberPerToken);
      setUserBalance(tokenNumber);
      console.log(tokenNumber);
    } catch (error) {
      console.error("Error fetching balances:", error);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [connection, wallet, tokenMintPublicKey, numberPerToken]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = parseInt(e.target.value);
    setMintAmount(inputVal >= 0 ? inputVal : 0); // Ensure mintAmount is non-negative
  };

  return (
    <div className="bg-white py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-none">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Fungible Token Minter
          </h2>
          <div className="mt-6 flex flex-col gap-x-8 gap-y-20 lg:flex-row">
            <div className="lg:w-full lg:max-w-2xl lg:flex-auto">
              <p className="text-xl leading-8 text-gray-600">
                Enter the amount of fungible tokens to create and send to the
                connected solana wallet!
              </p>
              <div>
                <input
                  name="mintamount"
                  id="mintamount"
                  className="my-5 block w-full rounded-md border-0 py-1.5 pl-7 pr-20 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                  placeholder="100"
                  type="number"
                  value={mintAmount}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="rounded-md bg-red-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
                  onClick={mintMoreToken}
                  disabled={!mintAmount}
                >
                  Mint Token
                </button>
              </div>
            </div>
            <div className="lg:flex lg:flex-auto lg:justify-center">
              <dl className="w-64 space-y-8 xl:w-80">
                <div className="flex flex-col-reverse gap-y-4">
                  <dt className="text-base leading-7 text-gray-600">
                    Number of tokens in Connected Wallet
                  </dt>
                  <dd className="text-5xl font-semibold tracking-tight text-gray-900">
                    {userBalance} Tokens
                  </dd>

                  <dt className="text-base leading-7 text-gray-600">
                    Total Supply
                  </dt>
                  <dd className="text-5xl font-semibold tracking-tight text-gray-900">
                    {totalSupply} Tokens
                  </dd>
                </div>
                {/* {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex flex-col-reverse gap-y-4"
                  >
                    <dt className="text-base leading-7 text-gray-600">
                      {stat.label}
                    </dt>
                    <dd className="text-5xl font-semibold tracking-tight text-gray-900">
                      {stat.value}
                    </dd>
                  </div>
                ))} */}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
