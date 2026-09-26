import dns from "node:dns";
import mongoose from "mongoose";

// Set reliable DNS servers on Windows to resolve MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  if (typeof dns.setDefaultResultOrder === "function") {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch {
  // Ignore in restricted environments
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/royal_catalogue";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

function maskUri(uri: string) {
  try {
    return uri.replace(/\/\/(.*):(.*)@/, "//***:***@");
  } catch {
    return uri;
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn && cached.conn.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    };

    console.log(`[MongoDB] Connecting to: ${maskUri(MONGODB_URI)}`);

    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        const dbName = m.connection.name || "royal_catalogue";
        const host = m.connection.host || "localhost";
        console.log(`\x1b[32m[MongoDB] ✅ CONNECTED SUCCESSFULLY to database: "${dbName}" on ${host}\x1b[0m`);
        return m;
      })
      .catch((err) => {
        console.error(
          `\x1b[31m[MongoDB] ❌ CONNECTION FAILED: ${err.message}\x1b[0m\n` +
            `\x1b[33m[MongoDB] TIP: Make sure your current IP address (or 0.0.0.0/0) is whitelisted in MongoDB Atlas Network Access (https://cloud.mongodb.com)\x1b[0m`
        );
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
