// migrate-users.js
const mongoose = require("mongoose");
require("dotenv").config();

// Import your User model
const User = require("./src/models/user.model");

async function migrateUsers() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully");

    // Check how many users need migration
    const usersWithoutVerification = await User.countDocuments({
      isEmailVerified: { $exists: false },
    });

    console.log(`Found ${usersWithoutVerification} users that need migration`);

    if (usersWithoutVerification === 0) {
      console.log(
        "No users need migration. All users already have email verification fields."
      );
      process.exit(0);
    }

    // Run the migration
    console.log("Starting migration...");
    const result = await User.updateMany(
      { isEmailVerified: { $exists: false } },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpire: undefined,
        },
      }
    );

    console.log(`Migration completed successfully!`);
    console.log(`- Users updated: ${result.modifiedCount}`);
    console.log(`- Users matched: ${result.matchedCount}`);

    // Verify the migration
    const verifiedUsers = await User.countDocuments({
      isEmailVerified: true,
    });

    console.log(`Total verified users after migration: ${verifiedUsers}`);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    // Close the database connection
    await mongoose.connection.close();
    console.log("Database connection closed");
    process.exit(0);
  }
}

// Run the migration
migrateUsers();
