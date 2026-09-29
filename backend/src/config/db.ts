import mongoose from "mongoose";

export const connectDb = async (uri: string): Promise<void> => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
};
