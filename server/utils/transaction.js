const mongoose = require("mongoose");

// Transaction session helper with standalone MongoDB fallback
const runInTransaction = async (fn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await fn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (
      error.message &&
      (error.message.includes("does not support sessions") ||
        error.codeName === "IllegalOperation" ||
        error.code === 20)
    ) {
      console.warn("MongoDB replica set not detected. Executing operations without transaction session fallback...");
      return await fn(null);
    }
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = runInTransaction;
