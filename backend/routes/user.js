const express = require("express");
const { z } = require("zod");
const jwt = require("jsonwebtoken");
const router = express.Router();
const { Account, User } = require("../db");
const authMiddleware = require("../middleware");

const createToken = (payload) => {
  const token = jwt.sign(payload, process.env.JWT_SECRET);
  return token;
};

const signupInput = z.object({
  username: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  password: z.string(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupInput.safeParse(req.body);

  if (!success) {
    return res.status(403).json({ message: "wrong input" });
  }

  const existingUser = await User.findOne({
    username: req.body.username,
  });

  if (existingUser) {
    return res.status(409).json({ message: "Username already taken" });
  }

  const newUser = await User.create(req.body);
  await Account.create({ userId: newUser._id });
  const token = createToken({ userId: newUser._id });

  res.json({ message: "User created successfully", token });
});

const signinInput = z.object({
  username: z.string().email(),
  password: z.string(),
});

router.post("/signin", async (req, res) => {
  const { success } = signinInput.safeParse(req.body);

  if (!success) {
    return res.status(403).json({ message: "wrong input" });
  }

  const existingUser = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!existingUser) {
    return res.status(411).json({ message: "User does not exist" });
  }

  const token = createToken({ userId: existingUser._id });

  res.json({ token });
});

const updateInput = z.object({
  password: z.string().min(6).optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
});

router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateInput.safeParse(req.body);
  if (!success) {
    return res
      .status(411)
      .json({ message: "Error while updating information" });
  }

  await User.findByIdAndUpdate(req.userId, req.body);
  res.json({ message: "Updated successfully" });
});

router.get("/bulk", authMiddleware, async (req, res) => {
  const filter = req.query.filter || "";
  const filteredUsers = await User.find(
    {
      $or: [
        {
          firstName: {
            $regex: new RegExp(filter, "i"),
          },
        },
        {
          lastName: {
            $regex: new RegExp(filter, "i"),
          },
        },
      ],
    },
    "firstName lastName _id"
  );

  res.json({ users: filteredUsers });
});

module.exports = router;
