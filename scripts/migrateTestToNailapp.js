const { MongoClient } = require('mongodb');
require('dotenv').config();

// Source and target database names
const SOURCE_DB = 'test'; // Change this if your test database has a different name
const TARGET_DB = process.env.DB_NAME;
const MONGO_URI = process.env.MONGO_URI;

async function migrateData() {
  console.log(`Starting migration from ${SOURCE_DB} to ${TARGET_DB}...`);
  
  const client = new MongoClient(MONGO_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const sourceDb = client.db(SOURCE_DB);
    const targetDb = client.db(TARGET_DB);
    
    // Get all collections from source database
    const collections = await sourceDb.listCollections().toArray();
    
    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`Migrating collection: ${collectionName}`);
      
      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);
      
      // Get all documents from source collection
      const documents = await sourceCollection.find({}).toArray();
      console.log(`Found ${documents.length} documents in ${collectionName}`);
      
      if (documents.length > 0) {
        // Insert all documents to target collection
        const result = await targetCollection.insertMany(documents);
        console.log(`Inserted ${result.insertedCount} documents to ${collectionName}`);
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await client.close();
    console.log('Database connection closed');
  }
}

migrateData();
