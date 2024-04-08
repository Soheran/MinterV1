import { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "POST") {
    const jsonData = JSON.stringify(req.body); // Convert JSON data to string
    const name = req.body.name + ".json";

    const cloudinaryUploadUrl = `https://api.cloudinary.com/v1_1/db9aqguwu/raw/upload`;
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([jsonData], { type: "application/json" }),
      "file.json"
    );
    formData.append("public_id", name);
    formData.append("upload_preset", "jmnzgawq");

    fetch(cloudinaryUploadUrl, {
      method: "POST",
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        console.log("Upload response:", data);
        res.status(200).json({ result: data });
      })
      .catch((error) => {
        console.error("Error uploading:", error);
        res
          .status(500)
          .json({ message: "Error uploading JSON data to Cloudinary" });
      });

    // // Specify the path where you want to save the JSON file
    // const filePath = path.join(process.cwd(), "src/jsons", name + ".json");

    // // Write JSON data to file
    // fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
  } else {
    res.status(400).json({ message: "Error" });
  }
}
