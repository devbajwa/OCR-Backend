require("dotenv").config();

const express = require("express");
const { ImageAnnotatorClient } = require("@google-cloud/vision");
const cors = require("cors");

// The client automatically authenticates using GOOGLE_APPLICATION_CREDENTIALS set in the .env file.
// If the .env file is not loaded (Step 1), this step will fail.
const client = new ImageAnnotatorClient();
const app = express();
const port = 3001;

// --- Middleware Setup ---
// CORS: Allows requests from your React development server (default port 3000)
app.use(cors());
// Body Parser: Allows receiving JSON data. Set limit high for large image files (up to 10MB).
app.use(express.json({ limit: "10mb" }));

// --- OCR Endpoint ---
app.post("/api/urdu-ocr", async (req, res) => {
  console.log("Received OCR request...");

  // 1. Extract the Base64 image data from the request body
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    log("WHAT");
    return res.status(400).send({ error: "Image data is missing." });
  }

  // 2. Clean the data: strip the "data:image/..." header (e.g., 'data:image/png;base64,')
  let base64ImageContent = imageBase64;
  if (base64ImageContent.includes(",")) {
    base64ImageContent = base64ImageContent.split(",")[1];
  }

  try {
    // 3. Call the Cloud Vision API
    const [result] = await client.annotateImage({
      image: { content: base64ImageContent },
      // Use DOCUMENT_TEXT_DETECTION for highest quality OCR
      features: [{ type: "DOCUMENT_TEXT_DETECTION" }],
      imageContext: {
        // Hint the language to Arabic/Urdu script (using 'ar' for the script family)
        languageHints: ["ar"],
      },
    });

    // 4. Extract the full recognized text
    const fullText = result.fullTextAnnotation
      ? result.fullTextAnnotation.text
      : "No text found.";
    console.log("OCR Result Success.");

    // 5. Send the result back to the React frontend
    res.json({ text: fullText });
  } catch (error) {
    console.error("Vision API Error:", error);
    // Send a helpful error response back to the client
    res.status(500).json({
      error: "OCR processing failed on the server. Check console for details.",
    });
  }
});

// --- Start the Server ---
app.listen(port, () => {
  console.log(`✅ OCR Backend listening at http://localhost:${port}`);
});
