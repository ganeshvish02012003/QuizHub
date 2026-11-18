
import mongoose from "mongoose";
import { setServers } from "node:dns";

const connectDB = async () => {
  try {
    const dnsServers = process.env.MONGO_DNS_SERVERS
      ?.split(",")
      .map((server) => server.trim())
      .filter(Boolean);

    if (dnsServers?.length) {
      setServers(dnsServers);
    }

    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing in .env");
    }

    const connection = await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      `MongoDB connected: ${connection.connection.host}`
    );
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
