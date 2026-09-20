import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

// Lazy initialization of Gemini client to prevent crashes if key is missing on startup
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // Middleware for JSON body parsing with large payload support for image scanning
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      name: "Chuvadi Server",
      timestamp: new Date().toISOString(),
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY)
    });
  });

  // 1. Natural Language / Voice Expense Parser Endpoint
  app.post("/api/gemini/parse-expense", async (req, res) => {
    try {
      const { text, accounts = [], vehicles = [] } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Text prompt is required" });
      }

      const client = getGeminiClient();
      if (!client) {
        // Fallback heuristic parser if no API key is provided
        const parsedFallback = parseExpenseHeuristic(text, accounts, vehicles);
        return res.json({ result: parsedFallback, source: "heuristic" });
      }

      const accountsPrompt = accounts
        .map((a: any) => `- ID: "${a.id}", Name: "${a.name}", Type: "${a.type}", Balance: ${a.balance}`)
        .join("\n");
      const vehiclesPrompt = vehicles
        .map((v: any) => `- ID: "${v.id}", Name: "${v.name}", Number: "${v.vehicleNumber || ''}", Current Odo: ${v.currentOdometer || 0}`)
        .join("\n");

      const prompt = `You are the intelligent expense parsing engine for "Chuvadi" (Personal Life OS & Ledger).
Parse the user's natural language input into a structured financial or vehicle record.

User Input: "${text}"

Available Accounts in User's Ledger:
${accountsPrompt || "None configured"}

Available Vehicles in User's Garage:
${vehiclesPrompt || "None configured"}

Respond with ONLY valid JSON adhering strictly to this schema:
{
  "type": "EXPENSE" | "INCOME" | "TRANSFER",
  "amount": number,
  "description": string,
  "category": "Fuel" | "Food & Dining" | "Groceries" | "Shopping" | "Utilities" | "Healthcare" | "Entertainment" | "Travel" | "Vehicle Maintenance" | "Salary" | "Investment" | "Debt Settlement" | "Other",
  "fromAccountId": string or null,
  "toAccountId": string or null,
  "vehicleId": string or null,
  "isFuel": boolean,
  "fuelLiters": number or null,
  "odometer": number or null,
  "notes": string
}

Rules:
1. "amount": Must be a positive numeric value (e.g. if ₹2500, amount is 2500).
2. If the user mentions fuel (petrol, diesel, gas, EV charge) for a car or bike, set "category": "Fuel", "isFuel": true, and match the "vehicleId" if mentioned.
3. If the user mentions a specific account name (e.g., "HDFC", "ICICI", "Cash", "Salary Account"), select the matching fromAccountId. If not found, use null.
4. If it is a transfer between accounts, set "type": "TRANSFER", with both fromAccountId and toAccountId.
5. If it is an income (e.g., salary, refund, cashback, freelance), set "type": "INCOME" and set toAccountId.
6. Provide concise, clean description (e.g., "Petrol 20L - IndianOil", "Lunch at Saravana Bhavan").`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText.trim());
      return res.json({ result: parsedData, source: "gemini" });
    } catch (err: any) {
      console.error("Gemini parse error:", err);
      // Fallback to heuristic parser on API error
      const fallback = parseExpenseHeuristic(req.body.text || "", req.body.accounts || [], req.body.vehicles || []);
      return res.json({ result: fallback, source: "heuristic", error: err.message });
    }
  });

  // 2. Receipt / Document / Insurance / PUC Scanner Endpoint
  app.post("/api/gemini/scan-doc", async (req, res) => {
    try {
      const { imageBase64, mimeType = "image/jpeg" } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "imageBase64 is required" });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.status(400).json({
          error: "Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in your settings."
        });
      }

      const prompt = `Analyze this uploaded document/receipt for the "Chuvadi" Life OS app.
Determine whether it is:
1. An Expense Receipt / Invoice / Supermarket bill / Fuel bill
2. A Vehicle Insurance Policy certificate
3. A Vehicle PUC (Pollution Under Control) inspection certificate
4. General note or other document

Extract the data and respond with ONLY valid JSON strictly matching:
{
  "docType": "RECEIPT" | "VEHICLE_INSURANCE" | "VEHICLE_PUC" | "SERVICE_BILL" | "UNKNOWN",
  "summary": string,
  "date": "YYYY-MM-DD" or null,
  "amount": number or null,
  "vendorOrMerchant": string or null,
  "category": string or null,
  "lineItems": Array<{ "name": string, "amount": number }> or null,
  "vehicleDetails": {
    "vehicleNumber": string or null,
    "policyOrCertNumber": string or null,
    "expiryDate": "YYYY-MM-DD" or null,
    "premiumAmount": number or null,
    "issuerName": string or null,
    "odometerReading": number or null
  } or null
}`;

      // Clean base64 string
      const cleanData = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: cleanData
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.text || "{}";
      const result = JSON.parse(responseText.trim());
      return res.json({ result });
    } catch (err: any) {
      console.error("Gemini scan-doc error:", err);
      return res.status(500).json({ error: err.message || "Failed to scan document" });
    }
  });

  // 3. Conversational AI Insights & Financial Advisor Endpoint
  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { message, context = {} } = req.body;
      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const client = getGeminiClient();
      if (!client) {
        return res.json({
          reply: "I am Chuvadi AI Assistant. Please configure your GEMINI_API_KEY in the environment or settings to enable AI financial insights, receipt scanning, and smart budget advice."
        });
      }

      const systemPrompt = `You are "Chuvadi Assistant", an intelligent, thoughtful personal finance and life OS advisor named after the ancient palm-leaf ledger tradition of India.
You help the user optimize their daily spending, track vehicle maintenance and renewals (Insurance, PUC), monitor checklist tasks, and build healthy financial habits.
Be concise, practical, warm, and highlight specific figures in Indian Rupees (₹) when relevant.

Current User Snapshot Context:
- Net Worth / Total Balance: ₹${context.totalBalance || 0}
- Total Accounts: ${context.accountsCount || 0}
- Accounts Summary: ${JSON.stringify(context.accounts || [])}
- Recent Monthly Expenses: ₹${context.monthlyExpense || 0}
- Recent Transactions Sample: ${JSON.stringify((context.recentTransactions || []).slice(0, 10))}
- Vehicles: ${JSON.stringify(context.vehicles || [])}
- Pending Checklists / To-dos: ${JSON.stringify((context.pendingTodos || []).slice(0, 5))}`;

      const response = await client.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
          }
        ]
      });

      return res.json({ reply: response.text || "I was unable to analyze your data at this time." });
    } catch (err: any) {
      console.error("Gemini chat error:", err);
      return res.status(500).json({ error: err.message || "AI service error" });
    }
  });

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Chuvadi server running on http://0.0.0.0:${PORT}`);
  });
}

// Fallback rule-based parsing when API key is not yet set
function parseExpenseHeuristic(text: string, accounts: any[], vehicles: any[]) {
  const lower = text.toLowerCase();
  
  // Extract number (e.g. 500, 2,500, rs 400, inr 400)
  const amtMatch = text.match(/(?:rs\.?|inr|₹)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)/i);
  let amount = 0;
  if (amtMatch) {
    amount = parseFloat(amtMatch[1].replace(/,/g, ""));
  }

  let type: "EXPENSE" | "INCOME" | "TRANSFER" = "EXPENSE";
  if (lower.includes("received") || lower.includes("salary") || lower.includes("income") || lower.includes("credit") || lower.includes("cashback")) {
    type = "INCOME";
  } else if (lower.includes("transfer") || lower.includes("sent to my") || lower.includes("moved to")) {
    type = "TRANSFER";
  }

  // Detect category
  let category = "Other";
  let isFuel = false;
  let fuelLiters: number | null = null;

  if (lower.includes("petrol") || lower.includes("diesel") || lower.includes("fuel") || lower.includes("gas") || lower.includes("cng")) {
    category = "Fuel";
    isFuel = true;
    const ltrMatch = text.match(/([0-9]+(?:\.[0-9]+)?)\s*(?:l|ltr|liter|litres)/i);
    if (ltrMatch) fuelLiters = parseFloat(ltrMatch[1]);
  } else if (lower.includes("food") || lower.includes("dinner") || lower.includes("lunch") || lower.includes("breakfast") || lower.includes("hotel") || lower.includes("restaurant") || lower.includes("coffee") || lower.includes("tea")) {
    category = "Food & Dining";
  } else if (lower.includes("grocery") || lower.includes("groceries") || lower.includes("milk") || lower.includes("vegetable") || lower.includes("supermarket")) {
    category = "Groceries";
  } else if (lower.includes("service") || lower.includes("mechanic") || lower.includes("oil change") || lower.includes("puncture") || lower.includes("tyre")) {
    category = "Vehicle Maintenance";
  } else if (lower.includes("recharge") || lower.includes("electricity") || lower.includes("eb bill") || lower.includes("water") || lower.includes("wifi") || lower.includes("broadband")) {
    category = "Utilities";
  } else if (lower.includes("amazon") || lower.includes("flipkart") || lower.includes("myntra") || lower.includes("shopping") || lower.includes("cloth")) {
    category = "Shopping";
  }

  // Find matched account
  let fromAccountId: string | null = null;
  let toAccountId: string | null = null;
  for (const acc of accounts) {
    if (acc.name && lower.includes(acc.name.toLowerCase())) {
      if (type === "INCOME") {
        toAccountId = acc.id;
      } else {
        fromAccountId = acc.id;
      }
      break;
    }
  }

  // Default to first bank/cash account if none matched
  if (!fromAccountId && accounts.length > 0 && type !== "INCOME") {
    fromAccountId = accounts[0].id;
  }
  if (!toAccountId && accounts.length > 0 && type === "INCOME") {
    toAccountId = accounts[0].id;
  }

  // Find matched vehicle
  let vehicleId: string | null = null;
  for (const veh of vehicles) {
    if (veh.name && lower.includes(veh.name.toLowerCase())) {
      vehicleId = veh.id;
      break;
    }
  }
  if (!vehicleId && vehicles.length > 0 && (isFuel || category === "Vehicle Maintenance")) {
    vehicleId = vehicles[0].id;
  }

  return {
    type,
    amount,
    description: text.trim().slice(0, 100),
    category,
    fromAccountId,
    toAccountId,
    vehicleId,
    isFuel,
    fuelLiters,
    odometer: null,
    notes: "Auto-extracted via parser"
  };
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
