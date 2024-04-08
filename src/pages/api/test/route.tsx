// Import necessary dependencies
import { NextApiRequest, NextApiResponse } from "next";

// Define the handler function for your API endpoint
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Depending on the HTTP method, you can handle different types of requests
  if (req.method === "GET") {
    // Handle GET request
    res.status(200).json({ message: "GET request to the API endpoint" });
  } else if (req.method === "POST") {
    // Handle POST request
    // For example, you can access data from the request body
    const data = req.body;
    res.status(200).json({ message: "POST request to the API endpoint", data });
  } else {
    // Handle other HTTP methods
    res.status(405).json({ message: "Method Not Allowed" });
  }
}
