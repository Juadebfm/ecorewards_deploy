require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/user.model");
const Leaderboard = require("../models/leaderboard.model");
const bcrypt = require("bcryptjs");

// Mock data based on your original structure
const mockUsers = [
  {
    name: "GreenWarrior92",
    email: "greenwarrior92@example.com",
    points: 3500,
    ecoLevel: "leader",
  },
  {
    name: "EcoHero_Tobi",
    email: "ecohero.tobi@example.com",
    points: 3200,
    ecoLevel: "leader",
  },
  {
    name: "RecycleKing_Lagos",
    email: "recycleking.lagos@example.com",
    points: 2600,
    ecoLevel: "expert",
  },
  {
    name: "SustainableQueen",
    email: "sustainablequeen@example.com",
    points: 2780,
    ecoLevel: "expert",
  },
  {
    name: "CarbonFootprint_X",
    email: "carbonfootprint.x@example.com",
    points: 1800,
    ecoLevel: "leader",
  },
  {
    name: "ZeroWasteAda",
    email: "zerowaste.ada@example.com",
    points: 2200,
    ecoLevel: "expert",
  },
  {
    name: "GreenLifestyle",
    email: "greenlifestyle@example.com",
    points: 1700,
    ecoLevel: "leader",
  },
  {
    name: "EcoWarrior_Kemi",
    email: "ecowarrior.kemi@example.com",
    points: 1950,
    ecoLevel: "leader",
  },
  {
    name: "PlantBased_Chef",
    email: "plantbased.chef@example.com",
    points: 1650,
    ecoLevel: "leader",
  },
  {
    name: "SolarPower_Sam",
    email: "solarpower.sam@example.com",
    points: 1580,
    ecoLevel: "leader",
  },
  {
    name: "RenewableEnergy_Ruth",
    email: "renewable.ruth@example.com",
    points: 1420,
    ecoLevel: "leader",
  },
  {
    name: "ClimateAction_Chris",
    email: "climate.chris@example.com",
    points: 1380,
    ecoLevel: "leader",
  },
  {
    name: "GreenTransport_Tunde",
    email: "greentransport.tunde@example.com",
    points: 1250,
    ecoLevel: "leader",
  },
  {
    name: "WaterConserver_Wale",
    email: "waterconserver.wale@example.com",
    points: 1150,
    ecoLevel: "leader",
  },
  {
    name: "BikeCommuter_Bola",
    email: "bikecommuter.bola@example.com",
    points: 1080,
    ecoLevel: "leader",
  },
  {
    name: "CompostKing_Kola",
    email: "compostking.kola@example.com",
    points: 950,
    ecoLevel: "expert",
  },
  {
    name: "EcoEducator_Ese",
    email: "ecoeducator.ese@example.com",
    points: 890,
    ecoLevel: "expert",
  },
  {
    name: "NatureLover_Nike",
    email: "naturelover.nike@example.com",
    points: 820,
    ecoLevel: "expert",
  },
  {
    name: "GreenGardener_Grace",
    email: "greengardener.grace@example.com",
    points: 750,
    ecoLevel: "expert",
  },
  {
    name: "EcoNewbie_Nonso",
    email: "econewbie.nonso@example.com",
    points: 650,
    ecoLevel: "expert",
  },
];

// Activity types for generating realistic point history
const activityTypes = [
  { type: "recycling", description: "Recycled plastic bottles", points: 50 },
  {
    type: "energy_saving",
    description: "Used energy-efficient appliances",
    points: 75,
  },
  {
    type: "transport",
    description: "Used public transport instead of car",
    points: 40,
  },
  {
    type: "education",
    description: "Completed environmental course",
    points: 100,
  },
  {
    type: "challenge_completion",
    description: "Completed weekly eco-challenge",
    points: 150,
  },
  { type: "daily_login", description: "Daily app engagement", points: 10 },
];

const generateRecentActivities = (totalPoints) => {
  const activities = [];
  let remainingPoints = totalPoints;

  // Generate 3-8 recent activities that add up to total points
  const numActivities = Math.floor(Math.random() * 6) + 3;

  for (let i = 0; i < numActivities && remainingPoints > 0; i++) {
    const activity =
      activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const pointsForActivity = Math.min(
      activity.points + Math.floor(Math.random() * 50),
      Math.floor(remainingPoints / (numActivities - i))
    );

    if (pointsForActivity > 0) {
      activities.push({
        activityType: activity.type,
        pointsEarned: pointsForActivity,
        description: activity.description,
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
      });

      remainingPoints -= pointsForActivity;
    }
  }

  return activities;
};

const seedLeaderboard = async () => {
  try {
    console.log("🌱 Starting leaderboard seeding...");

    // Connect to MongoDB (adjust connection string as needed)
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGO_URI);
      console.log("📡 Connected to MongoDB");
    }

    // Clear existing data
    console.log("🧹 Clearing existing users and leaderboard data...");
    await User.deleteMany({});
    await Leaderboard.deleteMany({});

    // Create users
    console.log("👥 Creating users...");
    const createdUsers = [];

    for (const userData of mockUsers) {
      // Hash a default password for all users
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash("password123", salt);

      const user = new User({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        points: userData.points,
        ecoLevel: userData.ecoLevel,
        role: "user",
      });

      // Update eco level based on points
      user.updateEcoLevel();
      await user.save();

      createdUsers.push(user);
      console.log(`✅ Created user: ${user.name} with ${user.points} points`);
    }

    // Create leaderboard entries
    console.log("🏆 Creating leaderboard entries...");
    const leaderboardEntries = [];

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const recentActivities = generateRecentActivities(user.points);

      const leaderboardEntry = new Leaderboard({
        userId: user._id,
        totalPoints: user.points,
        currentRank: i + 1, // Temporary rank, will be recalculated
        previousRank:
          Math.random() > 0.3 ? i + Math.floor(Math.random() * 3) - 1 : null, // Some users have previous ranks
        weeklyPoints: Math.floor(user.points * 0.2), // 20% of total points as weekly
        monthlyPoints: Math.floor(user.points * 0.6), // 60% of total points as monthly
        recentActivities: recentActivities,
        lastPointsUpdate: new Date(),
      });

      await leaderboardEntry.save();
      leaderboardEntries.push(leaderboardEntry);
      console.log(`🎯 Created leaderboard entry for: ${user.name}`);
    }

    // Update all rankings and movements
    console.log("📊 Calculating rankings and movements...");
    await Leaderboard.updateAllRankings();

    // Get final leaderboard for display
    const finalLeaderboard = await Leaderboard.find({})
      .populate({
        path: "userId",
        select: "name email ecoLevel points",
      })
      .sort({ totalPoints: -1 });

    console.log("\n🏆 FINAL LEADERBOARD:");
    console.log("═══════════════════════════════════════════════════════");
    finalLeaderboard.forEach((entry, index) => {
      const movement =
        entry.rankMovement === "up"
          ? "▲"
          : entry.rankMovement === "down"
          ? "▼"
          : entry.rankMovement === "new"
          ? "🆕"
          : "━";

      console.log(
        `${String(index + 1).padStart(
          2
        )} ${movement} ${entry.userId.name.padEnd(25)} ${String(
          entry.totalPoints
        ).padStart(6)} pts [${entry.userId.ecoLevel}]`
      );
    });

    console.log("═══════════════════════════════════════════════════════");
    console.log(
      `✨ Successfully seeded ${createdUsers.length} users and leaderboard entries!`
    );
    console.log("🔐 All users have password: 'password123'");
    console.log("🚀 You can now test the leaderboard API endpoints!");
  } catch (error) {
    console.error("❌ Error seeding leaderboard:", error);
    process.exit(1);
  }
};

// Run the seed script
const runSeed = async () => {
  await seedLeaderboard();
  process.exit(0);
};

// Export for use in other files or run directly
if (require.main === module) {
  runSeed();
}

module.exports = seedLeaderboard;
