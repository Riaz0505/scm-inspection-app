import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors"; 

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// CORS Middleware
app.use(express.json());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true
}));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  const masked = MONGODB_URI.includes('@') 
    ? MONGODB_URI.split('@')[1].split('/')[0] // Show cluster host only for privacy
    : "Masked URL";
  console.log(`📡 MONGODB_URI check... Host: ${masked}`);
} else {
  console.error('🔴 CRITICAL: MONGODB_URI is missing. Check your .env file or Settings.');
}

// Set up storage for uploaded files
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

console.log(`📁 Uploads directory: ${uploadsDir}`);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Schemas & Models
const StyleSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  type: String,
  imageUrl: String,
  frontImageUrl: String,
  backImageUrl: String,
  layoutImage: String,
  customPoints: [{
    id: String,
    label: String,
    x: Number,
    y: Number
  }]
});
const StyleModel = mongoose.model("Style", StyleSchema, "styles");

const DefectSchema = new mongoose.Schema({
  reportId: String,
  id: String,
  styleId: String,
  styleName: String,
  layoutImage: String,
  frontImageUrl: String,
  backImageUrl: String,
  customPoints: [{
    id: String,
    label: String,
    x: Number,
    y: Number
  }],
  category: String,
  subCategory: String,
  part: String,
  status: { type: String, default: "pending" },
  reporterEmail: String,
  reporterUid: String,
  inspectorName: String,
  operation: String,
  operatorName: String,
  notes: String,
  defects: [{
    category: String,
    subCategory: String,
    imageUrl: String,
    part: String
  }],
  createdAt: { type: Date, default: Date.now },
  serverTimestamp: { type: Date, default: Date.now }
}, { 
  id: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
const DefectModel = mongoose.model("Defect", DefectSchema, "defects");

const CategorySchema = new mongoose.Schema({
  id: String,
  name: String,
  icon: String,
  imageUrl: String,
  subCategories: [{
    name: String,
    description: String,
    imageUrl: String
  }]
});
const CategoryModel = mongoose.model("Category", CategorySchema, "categories");

// Fallback Data Helpers
const DATA_DIR = path.join(process.cwd(), "data");
const STYLES_FILE = path.join(DATA_DIR, "styles.json");
const DEFECTS_FILE = path.join(DATA_DIR, "defects.json");
const CATEGORIES_FILE = path.join(DATA_DIR, "categories.json");

const DEFAULT_CATEGORIES = [
  {
    id: "cat-fabric",
    name: "Fabric Issues",
    icon: "Layers",
    imageUrl: "https://picsum.photos/seed/fabric/400/300",
    subCategories: [
      { name: "Pilling", description: "Small balls forming on fabric", imageUrl: "https://picsum.photos/seed/pilling/400/300" },
      { name: "Color Fading", description: "Color fading after wash", imageUrl: "https://picsum.photos/seed/fading/400/300" },
      { name: "Shrinkage", description: "Size becomes smaller", imageUrl: "https://picsum.photos/seed/shrink/400/300" },
      { name: "Uneven Dyeing", description: "Shade variation", imageUrl: "https://picsum.photos/seed/dye/400/300" },
      { name: "Fabric Thinning", description: "Low GSM", imageUrl: "https://picsum.photos/seed/thin/400/300" },
      { name: "Holes", description: "Weak yarn or holes", imageUrl: "https://picsum.photos/seed/hole/400/300" },
      { name: "Fabric Twisting", description: "Twisting after wash", imageUrl: "https://picsum.photos/seed/twist/400/300" }
    ]
  },
  {
    id: "cat-stitching",
    name: "Stitching Issues",
    icon: "Scissors",
    imageUrl: "https://picsum.photos/seed/stitching/400/300",
    subCategories: [
      { name: "Loose Threads", description: "Excessive loose threads", imageUrl: "https://picsum.photos/seed/loose/400/300" },
      { name: "Broken Stitches", description: "Stitches snapped", imageUrl: "https://picsum.photos/seed/broken/400/300" },
      { name: "Uneven Stitching", description: "Wavy or irregular lines", imageUrl: "https://picsum.photos/seed/uneven/400/300" },
      { name: "Seam Puckering", description: "Wrinkled seams", imageUrl: "https://picsum.photos/seed/pucker/400/300" },
      { name: "Skipped Stitches", description: "Missing stitches in line", imageUrl: "https://picsum.photos/seed/skipped/400/300" },
      { name: "Open Seams", description: "Seams not closed properly", imageUrl: "https://picsum.photos/seed/openseam/400/300" }
    ]
  },
  {
    id: "cat-fit",
    name: "Fit & Measurement",
    icon: "Ruler",
    imageUrl: "https://picsum.photos/seed/fit/400/300",
    subCategories: [
      { name: "Size Mismatch", description: "Label vs actual size", imageUrl: "https://picsum.photos/seed/mismatch/400/300" },
      { name: "Uneven Sleeves", description: "Sleeves different lengths", imageUrl: "https://picsum.photos/seed/sleeves/400/300" },
      { name: "Neck Stretching", description: "Collar loose or stretched", imageUrl: "https://picsum.photos/seed/neck/400/300" },
      { name: "Length Inconsistency", description: "Length varies from spec", imageUrl: "https://picsum.photos/seed/length/400/300" }
    ]
  },
  {
    id: "cat-printing",
    name: "Printing Issues",
    icon: "Palette",
    imageUrl: "https://picsum.photos/seed/printing/400/300",
    subCategories: [
      { name: "Print Cracking", description: "Print splitting apart", imageUrl: "https://picsum.photos/seed/cracking/400/300" },
      { name: "Print Peeling", description: "Print coming off", imageUrl: "https://picsum.photos/seed/peeling/400/300" },
      { name: "Misaligned Print", description: "Print not centered", imageUrl: "https://picsum.photos/seed/misaligned/400/300" },
      { name: "Ink Bleeding", description: "Ink spreading on fabric", imageUrl: "https://picsum.photos/seed/bleeding/400/300" }
    ]
  },
  {
    id: "cat-label",
    name: "Label & Branding",
    icon: "Tag",
    imageUrl: "https://picsum.photos/seed/label/400/300",
    subCategories: [
      { name: "Wrong Size Label", description: "Incorrect size tag", imageUrl: "https://picsum.photos/seed/wronglabel/400/300" },
      { name: "Misplaced Label", description: "Label in wrong position", imageUrl: "https://picsum.photos/seed/misplaced/400/300" },
      { name: "Itchy Neck Label", description: "Label material causing irritation", imageUrl: "https://picsum.photos/seed/itchy/400/300" }
    ]
  },
  {
    id: "cat-washing",
    name: "Washing & Finishing",
    icon: "Waves",
    imageUrl: "https://picsum.photos/seed/washing/400/300",
    subCategories: [
      { name: "Color Bleeding", description: "Color running during wash", imageUrl: "https://picsum.photos/seed/washbleed/400/300" },
      { name: "Chemical Stains", description: "Stains from processing", imageUrl: "https://picsum.photos/seed/stains/400/300" },
      { name: "Improper Ironing", description: "Burn marks or poor press", imageUrl: "https://picsum.photos/seed/iron/400/300" },
      { name: "Wrinkles", description: "Poor finishing quality", imageUrl: "https://picsum.photos/seed/wrinkles/400/300" }
    ]
  }
];

const readJsonFile = (filePath: string, defaultData: any) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const content = fs.readFileSync(filePath, "utf-8").trim();
    if (!content) {
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return defaultData;
  }
};

if (!fs.existsSync(DATA_DIR)) {
  console.log(`📁 Creating data directory: ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure files exist with valid JSON
readJsonFile(STYLES_FILE, [{ id: "style-1", barcode: "123456", name: "Classic White T-Shirt", type: "tshirt" }]);
readJsonFile(DEFECTS_FILE, []);
readJsonFile(CATEGORIES_FILE, DEFAULT_CATEGORIES);

// API Routes
app.post("/api/admin/seed", async (req, res) => {
  try {
    if (MONGODB_URI) {
      await CategoryModel.deleteMany({});
      await CategoryModel.insertMany(DEFAULT_CATEGORIES);
      
      const styleCount = await StyleModel.countDocuments();
      if (styleCount === 0) {
        await StyleModel.insertMany([{ id: "style-1", barcode: "123456", name: "Classic White T-Shirt", type: "tshirt" }]);
      }
    } else {
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
    }
    res.json({ success: true, message: "System seeded with default categories and styles" });
  } catch (error) {
    console.error("Seed Error:", error);
    res.status(500).json({ success: false, message: "Failed to seed data" });
  }
});

app.get("/api/stats/global", async (req, res) => {
  try {
    let allDefects = [];
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      allDefects = await DefectModel.find().lean();
    } else {
      if (fs.existsSync(DEFECTS_FILE)) {
        allDefects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      }
    }

    const styleCounts: Record<string, number> = {};
    const partCounts: Record<string, number> = {};
    const operatorCounts: Record<string, number> = {};
    const workerPerformanceMap: Record<string, { operation: string, count: number, defects: Record<string, number> }> = {};

    if (Array.isArray(allDefects)) {
      allDefects.forEach((report: any) => {
        const styleKey = report.styleName || report.styleId || 'Unknown Style';
        const defectCount = report.defects?.length || 1;
        styleCounts[styleKey] = (styleCounts[styleKey] || 0) + defectCount;

        const inspectorKey = report.inspectorName || report.reporterEmail || 'Unknown Inspector';
        operatorCounts[inspectorKey] = (operatorCounts[inspectorKey] || 0) + defectCount;

        // Worker Performance Calculation
        if (report.operatorName) {
          const workerKey = `${report.operatorName}-${report.operation || 'N/A'}`;
          if (!workerPerformanceMap[workerKey]) {
            workerPerformanceMap[workerKey] = { 
              operation: report.operation || 'N/A', 
              count: 0, 
              defects: {} 
            };
          }
          workerPerformanceMap[workerKey].count += defectCount;
          
          if (report.defects && Array.isArray(report.defects)) {
            report.defects.forEach((d: any) => {
              if (d.subCategory) {
                workerPerformanceMap[workerKey].defects[d.subCategory] = (workerPerformanceMap[workerKey].defects[d.subCategory] || 0) + 1;
              }
            });
          }
        }

        if (report.defects && Array.isArray(report.defects)) {
          report.defects.forEach((d: any) => {
            if (d.part) {
              partCounts[d.part] = (partCounts[d.part] || 0) + 1;
            }
          });
        } else if (typeof report.part === 'string') {
          const parts = report.part.split(",").map((p: string) => p.trim());
          parts.forEach((p: string) => {
            if (p) partCounts[p] = (partCounts[p] || 0) + 1;
          });
        }
      });
    }

    const workerPerformance = Object.entries(workerPerformanceMap).map(([key, data]) => {
      const [name] = key.split('-');
      // Find top defect category
      const topDefect = Object.entries(data.defects)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
        
      return {
        name,
        operation: data.operation,
        count: data.count,
        topDefect
      };
    }).sort((a, b) => b.count - a.count).slice(0, 15);

    res.json({
      styles: Object.entries(styleCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      parts: Object.entries(partCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      operators: Object.entries(operatorCounts).map(([email, count]) => ({ email, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      workerPerformance
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(200).json({ styles: [], parts: [], operators: [] }); 
  }
});

app.get("/api/stats/style/:barcode", async (req, res) => {
  const { barcode } = req.params;
  try {
    let styleDefects = [];
    if (MONGODB_URI) {
      styleDefects = await DefectModel.find({ styleId: barcode });
    } else {
      const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      styleDefects = defects.filter((d: any) => d.styleId === barcode);
    }

    const counts: Record<string, number> = {};
    const details: Record<string, Record<string, number>> = {};
    let totalDefectsCount = 0;
    
    styleDefects.forEach((report: any) => {
      const processPoint = (part: string, subCat: string | undefined) => {
        if (!part) return;
        counts[part] = (counts[part] || 0) + 1;
        totalDefectsCount++;
        if (subCat) {
          if (!details[part]) details[part] = {};
          details[part][subCat] = (details[part][subCat] || 0) + 1;
        }
      };

      if (report.defects && report.defects.length > 0) {
        report.defects.forEach((d: any) => {
          processPoint(d.part, d.subCategory);
        });
      } else if (report.part) {
        processPoint(report.part, report.subCategory);
      }
    });

    res.json({ 
      counts, 
      details, 
      totalReports: styleDefects.length,
      totalDefects: totalDefectsCount
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

app.get("/api/health", (req, res) => {
  const mongoStatus = MONGODB_URI 
    ? (mongoose.connection.readyState === 1 ? "connected" : mongoose.connection.readyState === 2 ? "connecting" : "disconnected") 
    : "not_configured";
    
  res.json({ 
    status: "ok", 
    mode: process.env.NODE_ENV || 'development',
    mongo: mongoStatus,
    time: new Date().toISOString(),
    dataDirExists: fs.existsSync(DATA_DIR),
    uploadsDirExists: fs.existsSync(uploadsDir)
  });
});

app.use("/uploads", express.static(uploadsDir));
console.log(`🚀 Serving static files from: ${uploadsDir} at /uploads`);

// Add a test route to check if uploads directory is accessible
app.get("/api/debug-uploads", (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    res.json({ 
      exists: fs.existsSync(uploadsDir), 
      path: uploadsDir, 
      files: files,
      cwd: process.cwd() 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, path: uploadsDir });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    let categories = [];
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      categories = await CategoryModel.find();
    } else {
      categories = readJsonFile(CATEGORIES_FILE, DEFAULT_CATEGORIES);
    }
    
    if (categories.length === 0 && DEFAULT_CATEGORIES.length > 0) {
      if (MONGODB_URI && mongoose.connection.readyState === 1) {
        await CategoryModel.insertMany(DEFAULT_CATEGORIES);
        categories = await CategoryModel.find();
      } else {
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
        categories = DEFAULT_CATEGORIES;
      }
    }
    res.json(categories);
  } catch (error) {
    console.error("Fetch Categories Error:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  try {
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      const data = req.body;
      const updated = await CategoryModel.findOneAndUpdate(
        { id: data.id },
        { $set: data },
        { upsert: true, new: true }
      );
      console.log(`✅ Category updated in MongoDB: ${data.name}`);
      res.json(updated);
    } else {
      const categories = readJsonFile(CATEGORIES_FILE, DEFAULT_CATEGORIES);
      const index = categories.findIndex((c: any) => c.id === req.body.id);
      if (index !== -1) {
        categories[index] = req.body;
      } else {
        categories.push(req.body);
      }
      fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
      res.json(req.body);
    }
  } catch (error: any) {
    console.error("❌ Save Category Error:", error.message);
    res.status(500).json({ message: "Failed to save category" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  try {
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      const updated = await CategoryModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id: id }, { name: id }] }, 
        { $set: req.body }, 
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Category not found in MongoDB" });
      console.log(`✅ Category ${id} updated in MongoDB`);
      res.json(updated);
    } else {
      const categories = readJsonFile(CATEGORIES_FILE, DEFAULT_CATEGORIES);
      const index = categories.findIndex((c: any) => c.id === id || c._id === id || c.name === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...req.body };
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        console.log(`📂 Category ${id} updated in Local JSON`);
        res.json(categories[index]);
      } else {
        res.status(404).json({ message: "Category not found locally" });
      }
    }
  } catch (error: any) {
    console.error("❌ PUT Category Error:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

app.get("/api/styles", async (req, res) => {
  const barcode = req.query.barcode as string;
  try {
    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      const cleanBarcode = (barcode || "").toString().trim();
      
      let query = {};
      if (cleanBarcode) {
        // Try exact match and regex match for maximum compatibility
        query = {
          $or: [
            { barcode: cleanBarcode },
            { barcode: { $regex: new RegExp(`^${cleanBarcode}$`, "i") } }
          ]
        };
      }
      
      console.log(`🔍 MongoDB Styles Fetch: Searching for "${cleanBarcode}"`);
      const styles = await StyleModel.find(query).lean();
      console.log(`✅ Found ${styles.length} styles`);
      return res.json(styles);
    } else {
      const styles = readJsonFile(STYLES_FILE, []);
      if (barcode) {
        const cleanBarcode = barcode.trim().toLowerCase();
        const style = styles.find((s: any) => 
          s.barcode && s.barcode.toString().trim().toLowerCase() === cleanBarcode
        );
        return res.json(style ? [style] : []);
      }
      return res.json(styles);
    }
  } catch (error: any) {
    console.error("❌ Fetch Styles Error:", error.message);
    res.status(500).json({ message: "Failed to fetch styles", error: error.message });
  }
});

app.post("/api/styles", async (req, res) => {
  try {
    const styleData = { ...req.body };
    if (styleData.barcode) {
      styleData.barcode = styleData.barcode.toString().trim();
    }

    if (MONGODB_URI && mongoose.connection.readyState === 1) {
      const { barcode } = styleData;
      if (!barcode) return res.status(400).json({ message: "Barcode is required" });
      
      const cleanBarcode = barcode.toString().trim();
      // Case-insensitive search for existing style
      const existing = await StyleModel.findOne({ 
        barcode: { $regex: new RegExp(`^${cleanBarcode}$`, "i") } 
      });
      if (existing) {
        Object.assign(existing, styleData);
        await existing.save();
        return res.json(existing);
      }
      const newStyle = new StyleModel(styleData);
      await newStyle.save();
      res.status(201).json(newStyle);
    } else {
      const styles = readJsonFile(STYLES_FILE, []);
      const barcodeToMatch = (styleData.barcode || "").toString().trim().toLowerCase();
      
      if (!barcodeToMatch) return res.status(400).json({ message: "Barcode is required" });

      const index = styles.findIndex((s: any) => 
        s.barcode && s.barcode.toString().trim().toLowerCase() === barcodeToMatch
      );
      
      if (index !== -1) {
        styles[index] = { ...styles[index], ...styleData };
      } else {
        styles.push({ id: Date.now().toString(), ...styleData });
      }
      fs.writeFileSync(STYLES_FILE, JSON.stringify(styles, null, 2));
      console.log(`✅ Style saved to local JSON: ${barcodeToMatch}`);
      res.json(styleData);
    }
  } catch (error: any) {
    console.error("❌ Save Style Error:", error.message);
    res.status(500).json({ message: "Failed to save style", error: error.message });
  }
});

app.post("/api/upload", upload.single("image"), (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  const filename = req.file.filename;
  // Use relative path for internal consistency
  const imageUrl = `/uploads/${filename}`;
  
  console.log(`✅ File uploaded: ${filename} -> ${imageUrl}`);
  res.json({ imageUrl, fullUrl: imageUrl });
});

app.get("/api/defects", async (req, res) => {
  if (MONGODB_URI) {
    const defects = await DefectModel.find().sort({ createdAt: -1 });
    res.json(defects);
  } else {
    const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
    res.json(defects);
  }
});

// ✅ 3. FIXED DEFECT API (CRITICAL FIX FOR FIRESTORE ERRORS)
app.post("/api/defects", async (req, res) => {
  const inspector = req.body.inspectorName || 'Unknown';
  console.log(`📥 Incoming Report from: ${inspector}`);
  
  try {
    // Payload cleaning
    const payload = { ...req.body };

    // 🔥 VITAL FIX: Ensure empty arrays instead of undefined
    payload.customPoints = payload.customPoints || [];
    payload.defects = payload.defects || [];

    // Sync IDs
    if (!payload.reportId && payload.id) {
      payload.reportId = payload.id;
    }

    if (MONGODB_URI) {
      delete payload._id; // Prevent ObjectId casting issues
      const newDefect = new DefectModel(payload);
      await newDefect.save();
      res.status(201).json(newDefect);
    } else {
      const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      const newDefect = { id: Date.now().toString(), ...payload, createdAt: new Date().toISOString() };
      defects.push(newDefect);
      fs.writeFileSync(DEFECTS_FILE, JSON.stringify(defects, null, 2));
      res.status(201).json(newDefect);
    }
  } catch (error: any) {
    console.error("❌ Error saving defect:", error.message);
    res.status(500).json({ message: "Failed to save defect", error: error.message });
  }
});

app.patch("/api/defects/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (MONGODB_URI) {
      let updated = await DefectModel.findOneAndUpdate({ reportId: id }, { status }, { new: true });
      if (!updated) updated = await DefectModel.findOneAndUpdate({ id: id }, { status }, { new: true });
      
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      if (!updated && isObjectId) {
        updated = await DefectModel.findByIdAndUpdate(id, { status }, { new: true });
      }
      if (!updated) return res.status(404).json({ message: "Defect not found" });
      res.json(updated);
    } else {
      const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      const index = defects.findIndex((d: any) => d.id === id);
      if (index !== -1) {
        defects[index].status = status;
        fs.writeFileSync(DEFECTS_FILE, JSON.stringify(defects, null, 2));
        res.json(defects[index]);
      } else {
        res.status(404).json({ message: "Defect not found" });
      }
    }
  } catch (err) {
    res.status(500).json({ message: "Server error during update" });
  }
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    res.json({ success: true, user: { name: "SCM Admin", role: "admin", email: "admin@scmgarments.com" } });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials" });
  }
});

if (MONGODB_URI) {
  console.log("⏳ Attempting to connect to MongoDB...");
  
  const connectDB = () => {
    mongoose.connect(MONGODB_URI)
      .then(async () => {
        const dbName = mongoose.connection.db?.databaseName;
        const host = mongoose.connection.host;
        console.log(`🟢 Connected to MongoDB Successfully!`);
        console.log(`📡 Database: ${dbName}`);
        console.log(`🏠 Host: ${host}`);
      })
      .catch(err => {
        console.error("🔴 MongoDB connection error:", err.message);
        console.log("⚠️ Falling back to local JSON data in /data directory");
      });
  };

  connectDB();

  mongoose.connection.on('error', (err) => {
    console.error(`🔴 MongoDB Runtime Error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('🟡 MongoDB Disconnected! Attempting to reconnect in 5s...');
    setTimeout(connectDB, 5000);
  });
} else {
  console.log("ℹ️ No MONGODB_URI found in environment variables.");
  console.log("⚠️ Using local JSON data in /data directory. If you want to use MongoDB, please set MONGODB_URI in Settings -> Secrets.");
}

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  // Only serve production build if NODE_ENV is production AND dist exists.
  // Otherwise, use Vite middleware for live development.
  const isProduction = process.env.NODE_ENV === "production" && fs.existsSync(distPath);

  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Mode: ${isProduction ? 'Production (Static)' : 'Development (Vite Middleware)'}`);

  if (!isProduction) {
    const vite = await createViteServer({ 
      server: { middlewareMode: true }, 
      appType: "spa" 
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ SERVER RUNNING: http://localhost:${PORT}`);
  });
}

startServer();