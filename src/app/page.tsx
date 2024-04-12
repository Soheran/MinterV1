import { useState } from "react";
import MintPage from "../components/MintPage";

export default function Home() {
  const secretKey = process.env.SECRET_KEY;

  return (
    <>
      <MintPage secretKey={secretKey} />
    </>
  );
}
