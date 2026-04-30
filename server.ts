import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import multer from "multer";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend working ✅");
});

app.get("/api", (req, res) => {
  res.json({ message: "API working ✅" });
});

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;

// Set up storage for uploaded files
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

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
const StyleModel = mongoose.model("Style", StyleSchema);

const DefectSchema = new mongoose.Schema({
  reportId: String, // Explicitly named for Firebase IDs
  id: String, // String compatibility for older records/JSON fallback
  styleId: String,
  styleName: String,
  layoutImage: String,
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
  id: false, // Disable the 'id' virtual to prevent conflict with string 'id' field
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
const DefectModel = mongoose.model("Defect", DefectSchema);

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
const CategoryModel = mongoose.model("Category", CategorySchema);

// Fallback Data Helpers
const DATA_DIR = path.join(__dirname, "data");
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

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(STYLES_FILE) || fs.readFileSync(STYLES_FILE, "utf-8") === "[]") {
  fs.writeFileSync(STYLES_FILE, JSON.stringify([
    { id: "style-1", barcode: "123456", name: "Classic White T-Shirt", type: "tshirt" }
  ]));
}
if (!fs.existsSync(DEFECTS_FILE)) fs.writeFileSync(DEFECTS_FILE, JSON.stringify([]));
if (!fs.existsSync(CATEGORIES_FILE) || fs.readFileSync(CATEGORIES_FILE, "utf-8") === "[]") {
  fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES));
}

// API Routes start here
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

    if (Array.isArray(allDefects)) {
      allDefects.forEach((report: any) => {
        const styleKey = report.styleName || report.styleId || 'Unknown Style';
        styleCounts[styleKey] = (styleCounts[styleKey] || 0) + (report.defects?.length || 1);

        const opKey = report.inspectorName || report.reporterEmail || 'operator@scm.com';
        operatorCounts[opKey] = (operatorCounts[opKey] || 0) + (report.defects?.length || 1);

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

    res.json({
      styles: Object.entries(styleCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      parts: Object.entries(partCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15),
      operators: Object.entries(operatorCounts).map(([email, count]) => ({ email, count })).sort((a, b) => b.count - a.count).slice(0, 10)
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(200).json({ styles: [], parts: [], operators: [] }); // Graceful fallback
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

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    mode: process.env.NODE_ENV || 'development',
    mongo: MONGODB_URI ? "configured" : "mock",
    time: new Date().toISOString()
  });
});

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(uploadsDir));

// API Routes
app.get("/api/categories", async (req, res) => {
  try {
    let categories = [];
    if (MONGODB_URI) {
      categories = await CategoryModel.find();
    } else {
      if (fs.existsSync(CATEGORIES_FILE)) {
        categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"));
      }
    }

    // Auto-seed if empty and we have defaults
    if (categories.length === 0 && DEFAULT_CATEGORIES.length > 0) {
      console.log("Auto-seeding empty categories database...");
      if (MONGODB_URI) {
        await CategoryModel.insertMany(DEFAULT_CATEGORIES);
        categories = await CategoryModel.find();
      } else {
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(DEFAULT_CATEGORIES, null, 2));
        categories = DEFAULT_CATEGORIES;
      }
    }

    res.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

app.post("/api/categories", async (req, res) => {
  if (MONGODB_URI) {
    const category = new CategoryModel(req.body);
    await category.save();
    res.status(201).json(category);
  } else {
    const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"));
    const newCategory = { id: Date.now().toString(), ...req.body };
    categories.push(newCategory);
    fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    res.status(201).json(newCategory);
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`[API] Updating category: ${id}`, req.body);
  
  try {
    if (MONGODB_URI) {
      const updated = await CategoryModel.findOneAndUpdate(
        { $or: [{ _id: id }, { id: id }, { name: id }] }, 
        { $set: req.body }, 
        { new: true }
      );
      if (!updated) return res.status(404).json({ message: "Category not found in DB" });
      res.json(updated);
    } else {
      const categories = JSON.parse(fs.readFileSync(CATEGORIES_FILE, "utf-8"));
      const index = categories.findIndex((c: any) => c.id === id || c._id === id || c.name === id);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...req.body };
        fs.writeFileSync(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
        console.log(`[API] Saved to file: ${CATEGORIES_FILE}`);
        res.json(categories[index]);
      } else {
        res.status(404).json({ message: "Category not found in JSON" });
      }
    }
  } catch (error) {
    console.error(`[API] Update error:`, error);
    res.status(500).json({ message: "Internal server error during update" });
  }
});

// API Routes
app.get("/api/styles", async (req, res) => {
  const barcode = req.query.barcode as string;
  try {
    if (MONGODB_URI) {
      const query = barcode ? { barcode } : {};
      const styles = await StyleModel.find(query);
      return res.json(styles);
    } else {
      const styles = JSON.parse(fs.readFileSync(STYLES_FILE, "utf-8"));
      if (barcode) {
        const style = styles.find((s: any) => s.barcode === barcode);
        return res.json(style ? [style] : []);
      }
      res.json(styles);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch styles" });
  }
});

app.post("/api/styles", async (req, res) => {
  try {
    if (MONGODB_URI) {
      const { barcode } = req.body;
      const existing = await StyleModel.findOne({ barcode });
      if (existing) {
        Object.assign(existing, req.body);
        await existing.save();
        return res.json(existing);
      }
      const newStyle = new StyleModel(req.body);
      await newStyle.save();
      res.status(201).json(newStyle);
    } else {
      const styles = JSON.parse(fs.readFileSync(STYLES_FILE, "utf-8"));
      const index = styles.findIndex((s: any) => s.barcode === req.body.barcode);
      if (index !== -1) {
        styles[index] = { ...styles[index], ...req.body };
      } else {
        styles.push({ id: Date.now().toString(), ...req.body });
      }
      fs.writeFileSync(STYLES_FILE, JSON.stringify(styles, null, 2));
      res.json(req.body);
    }
  } catch (error) {
    res.status(500).json({ message: "Failed to save style" });
  }
});

app.post("/api/upload", upload.single("image"), (req: any, res: any) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // Use relative path to ensure it works regardless of proxy/protocol/host
  const imageUrl = `/uploads/${req.file.filename}`;
  res.json({ imageUrl });
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

app.post("/api/defects", async (req, res) => {
  const inspector = req.body.inspectorName || 'Unknown';
  console.log(`📥 Incoming Report from: ${inspector} (${req.body.reporterEmail})`);
  
  try {
    if (MONGODB_URI) {
      // Create a copy and clean up forbidden fields that might trigger CastError
      const payload = { ...req.body };
      
      // Ensure we have a string reportId for lookups
      if (!payload.reportId && payload.id) {
        payload.reportId = payload.id;
      }

      // VITAL: Strip _id and id from payload before saving to MongoDB
      // so Mongoose doesn't try to use a string ID as an ObjectId
      delete payload._id;
      // We keep payload.id as it's defined as a String in our schema, 
      // but if it's causing issues we can strip it too.
      
      const newDefect = new DefectModel(payload);
      await newDefect.save();
      console.log(`✅ Report saved to MongoDB: ${newDefect._id}`);
      res.status(201).json(newDefect);
    } else {
      const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      const newDefect = { id: Date.now().toString(), ...req.body, createdAt: new Date().toISOString() };
      defects.push(newDefect);
      fs.writeFileSync(DEFECTS_FILE, JSON.stringify(defects, null, 2));
      res.status(201).json(newDefect);
    }
  } catch (error: any) {
    console.error("â Œ Error saving defect:", error.message);
    res.status(500).json({ message: "Failed to save defect report", error: error.message });
  }
});

app.patch("/api/defects/:id", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  console.log(`🔄 Attempting to resolve defect: ${id} to status: ${status}`);
  
  try {
    if (MONGODB_URI) {
      let updated = null;
      
      // 1. Try finding by custom reportId (String search - SAFE)
      // Uses the string field reportId. 
      updated = await DefectModel.findOneAndUpdate({ reportId: id }, { status }, { new: true });
      
      // 2. Try by custom 'id' field (String search - SAFE)
      if (!updated) {
        updated = await DefectModel.findOneAndUpdate({ id: id }, { status }, { new: true });
      }

      // 3. Last fallback: ONLY if it's a valid 24-character hex ObjectId
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
      if (!updated && isObjectId) {
        try {
          // Use findById only if it looks like an ObjectId to prevent CastError crashes
          updated = await DefectModel.findByIdAndUpdate(id, { status }, { new: true });
        } catch (innerErr) {
          console.warn("Skipping ObjectId update due to casting issue:", id);
        }
      }
      
      if (!updated) {
        console.warn(`⚠️ Defect not found in DB with ID: ${id}`);
        return res.status(404).json({ message: "Defect not found in DB" });
      }
      
      console.log(`✅ Defect ${id} resolved successfully`);
      res.json(updated);
    } else {
      const defects = JSON.parse(fs.readFileSync(DEFECTS_FILE, "utf-8"));
      const index = defects.findIndex((d: any) => d.id === id);
      if (index !== -1) {
        defects[index].status = status;
        fs.writeFileSync(DEFECTS_FILE, JSON.stringify(defects, null, 2));
        res.json(defects[index]);
      } else {
        res.status(404).json({ message: "Defect not found in JSON" });
      }
    }
  } catch (err) {
    console.error("Update defect error:", err);
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
  mongoose.connect(MONGODB_URI)
    .then(async () => {
      console.log("Connected to MongoDB");
      try {
        // Seed Categories if empty
        const catCount = await CategoryModel.countDocuments();
        if (catCount === 0) {
          console.log("Seeding MongoDB categories...");
          await CategoryModel.insertMany(DEFAULT_CATEGORIES);
        }
        // Seed Styles if empty
        const styleCount = await StyleModel.countDocuments();
        if (styleCount === 0) {
          console.log("Seeding MongoDB styles...");
          const styleData = fs.existsSync(STYLES_FILE) ? JSON.parse(fs.readFileSync(STYLES_FILE, "utf-8")) : [{ id: "style-1", barcode: "123456", name: "Classic T", type: "tshirt" }];
          await StyleModel.insertMany(styleData);
        }
      } catch (seedErr) {
        console.error("Error seeding MongoDB:", seedErr);
      }
    })
    .catch(err => console.error("MongoDB connection error:", err));
} else {
  console.warn("MONGODB_URI not found. Running in Mock Mode with JSON files.");
}

async function startServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(distPath);

  if (!isProduction) {
    console.log("🛠️ Starting in DEVELOPMENT mode");
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    console.log("🚀 Starting in PRODUCTION mode");
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Build artifacts not found. Please run 'npm run build'.");
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✅ SERVER RUNNING: http://localhost:${PORT} [${isProduction ? 'PROD' : 'DEV'}]`);
    if (!MONGODB_URI) {
      console.log(`📝 MONGODB_URI not set. Local storage active.`);
    }
  });
}

startServer();
