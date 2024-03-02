const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const { Account } = require("../db");
const authMiddleware = require("../middleware");

router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({ userId: req.userId });
  res.json({ balance: account.balance });
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  const { to, amount } = req.body;

  // fetch the accounts within the transfer
  const account = await Account.findOne({ userId: req.userId }).session(
    session
  );
  if (account.balance < amount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Insufficient balance" });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);
  if (req.userId === to || !toAccount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "Invalid account" });
  }

  // perform the transfer
  await Account.updateOne(
    { userId: req.userId },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);
  await Account.updateOne(
    { userId: to },
    {
      $inc: {
        balance: amount,
      },
    }
  ).session(session);

  // commit the transaction
  await session.commitTransaction();

  res.json("Transfer successful");
});

module.exports = router;
