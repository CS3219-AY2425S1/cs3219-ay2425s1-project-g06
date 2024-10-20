import mongoose from "mongoose";

const Schema = mongoose.Schema;

const UserModelSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  isAdmin: {
    type: Boolean,
    required: true,
    default: false,
  },
  avatar: {
    type: String,
    default: "https://prabhat.codes/default-user.png",
  },
  programmingLanguagePreference: {
    type: String,
    enum: ["Python", "Java", "C++"],
    default: "Python",
  },
});

export default mongoose.model("UserModel", UserModelSchema);
