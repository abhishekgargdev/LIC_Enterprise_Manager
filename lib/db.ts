import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not defined.")
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: {
    conn: typeof mongoose | null
    promise: Promise<typeof mongoose> | null
  }
}

let cached: {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
} = globalWithMongoose.mongoose ?? { conn: null, promise: null }

if (!cached.promise) {
  cached.promise = mongoose.connect(MONGODB_URI).then((mongooseInstance) => mongooseInstance)
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  cached.conn = await cached.promise
  globalWithMongoose.mongoose = cached
  return cached.conn
}
