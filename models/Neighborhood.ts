// models/Neighborhood.ts
import mongoose from "mongoose";

const NeighborhoodSchema = new mongoose.Schema({
  district: { type: String, required: true, unique: true },
  parent: { type: String, required: true },
});

export default mongoose.models.Neighborhood || mongoose.model("Neighborhood", NeighborhoodSchema);
