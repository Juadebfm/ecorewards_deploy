const mongoose = require("mongoose");

const LeaderboardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentRank: {
      type: Number,
      default: null,
    },
    previousRank: {
      type: Number,
      default: null,
    },
    rankMovement: {
      type: String,
      enum: ["up", "down", "none", "new"],
      default: "new",
    },
    weeklyPoints: {
      type: Number,
      default: 0,
    },
    monthlyPoints: {
      type: Number,
      default: 0,
    },
    lastPointsUpdate: {
      type: Date,
      default: Date.now,
    },
    // Track recent activities for points
    recentActivities: [
      {
        activityType: {
          type: String,
          enum: [
            "recycling",
            "energy_saving",
            "transport",
            "education",
            "challenge_completion",
            "daily_login",
          ],
        },
        pointsEarned: Number,
        description: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for fast leaderboard queries
LeaderboardSchema.index({ totalPoints: -1, currentRank: 1 });
LeaderboardSchema.index({ userId: 1 });

// Method to calculate rank movement
LeaderboardSchema.methods.calculateMovement = function () {
  if (this.previousRank === null) {
    return "new";
  }

  if (this.currentRank < this.previousRank) {
    return "up";
  } else if (this.currentRank > this.previousRank) {
    return "down";
  } else {
    return "none";
  }
};

// Static method to update all rankings
LeaderboardSchema.statics.updateAllRankings = async function () {
  try {
    // Get all leaderboard entries sorted by points (descending)
    const entries = await this.find({}).sort({ totalPoints: -1 });

    // Update rankings
    const bulkOps = entries.map((entry, index) => ({
      updateOne: {
        filter: { _id: entry._id },
        update: {
          previousRank: entry.currentRank,
          currentRank: index + 1,
          rankMovement: entry.currentRank
            ? index + 1 < entry.currentRank
              ? "up"
              : index + 1 > entry.currentRank
              ? "down"
              : "none"
            : "new",
        },
      },
    }));

    if (bulkOps.length > 0) {
      await this.bulkWrite(bulkOps);
    }

    return { success: true, updatedCount: bulkOps.length };
  } catch (error) {
    throw new Error(`Failed to update rankings: ${error.message}`);
  }
};

// Static method to sync user points
LeaderboardSchema.statics.syncUserPoints = async function (userId, points) {
  try {
    const leaderboardEntry = await this.findOneAndUpdate(
      { userId },
      {
        totalPoints: points,
        lastPointsUpdate: Date.now(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return leaderboardEntry;
  } catch (error) {
    throw new Error(`Failed to sync user points: ${error.message}`);
  }
};

module.exports = mongoose.model("Leaderboard", LeaderboardSchema);
