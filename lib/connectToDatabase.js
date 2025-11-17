import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {};

let cachedClient = null;
let cachedDb = null;

if (!uri) {
    throw new Error("Please add your Mongo URI to .env");
}

export async function connectToDatabase() {
    try {
        if (cachedClient && cachedDb) {
            return { client: cachedClient, db: cachedDb };
        }

        const client = await new MongoClient(uri, options).connect();
        const db = client.db("colors")

        cachedClient = client;
        cachedDb = db;

        if (process.env.NODE_ENV === "production") {
            cachedClient = client;
            cachedDb = db;
        }

        return { client, db };
    } catch (e) {
        throw e;
    }
}