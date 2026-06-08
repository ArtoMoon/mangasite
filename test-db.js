const mongoose = require("mongoose");

const uri = "mongodb://root:JGJxoITXzaczbRAlQQue7gvdTJVWlFsIKa87T05CcMVD0sPvNa5eT5mP5hB1YfGw@187.77.92.205:808/?directConnection=true";

async function run() {
  try {
    await mongoose.connect(uri, { dbName: "test" }); // or whatever database name is used
    console.log("Connected to MongoDB");
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // Query mangas
    const MangaSchema = new mongoose.Schema({}, { strict: false });
    const Manga = mongoose.models.Manga || mongoose.model("Manga", MangaSchema, "mangas");
    
    const list = await Manga.find({}, "title status scheduleDay").lean();
    console.log("Manga list in DB:", JSON.stringify(list, null, 2));
    
    process.exit(0);
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1);
  }
}

run();
