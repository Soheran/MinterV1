import fs from "fs";
import { NextApiRequest, NextApiResponse } from "next";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const jsonData = req.body; // Assuming JSON data is sent in the request body

    // Specify the path where you want to save the JSON file
    const filePath = path.join(process.cwd(), "jsons", "data.json");

    // Write JSON data to file
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

    res.status(200).json({ message: "JSON data saved successfully!" });
  } else {
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
