import mongoose, { ConnectOptions } from "mongoose";

mongoose.set('strictQuery', true);
if (process.env.NODE_ENV === 'production') {
  mongoose.set('debug', false);
}

await mongoose.connect(mongoUrl, {
  // existing options…
  autoIndex: process.env.NODE_ENV !== 'production', // disable autoIndex in prod
} as ConnectOptions);
