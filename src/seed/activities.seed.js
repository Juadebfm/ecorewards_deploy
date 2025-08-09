require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/user.model");
const Activity = require("../models/activity.model");
const Leaderboard = require("../models/leaderboard.model");
const Partner = require("../models/partner.model"); // Your existing partner model
const Reward = require("../models/reward.model"); // Your existing reward model

// Partner purchase scenarios - realistic eco-friendly products
const partnerPurchaseTemplates = [
  {
    activityType: "qr_scan",
    productName: "Bamboo Toothbrush Set",
    category: "Personal Care",
    description: "Purchased eco-friendly bamboo toothbrush set",
    basePoints: 45,
  },
  {
    activityType: "qr_scan",
    productName: "Reusable Water Bottle",
    category: "Lifestyle",
    description: "Bought stainless steel reusable water bottle",
    basePoints: 60,
  },
  {
    activityType: "qr_scan",
    productName: "Organic Cotton T-Shirt",
    category: "Clothing",
    description: "Purchased organic cotton sustainable clothing",
    basePoints: 80,
  },
  {
    activityType: "qr_scan",
    productName: "Solar Phone Charger",
    category: "Electronics",
    description: "Bought portable solar phone charger",
    basePoints: 120,
  },
  {
    activityType: "qr_scan",
    productName: "Biodegradable Cleaning Products",
    category: "Home & Garden",
    description: "Purchased eco-friendly cleaning supplies",
    basePoints: 55,
  },
  {
    activityType: "qr_scan",
    productName: "Plant-Based Protein Powder",
    category: "Food & Nutrition",
    description: "Bought sustainable plant-based protein",
    basePoints: 70,
  },
  {
    activityType: "qr_scan",
    productName: "Recycled Paper Notebooks",
    category: "Office Supplies",
    description: "Purchased notebooks made from recycled paper",
    basePoints: 35,
  },
  {
    activityType: "qr_scan",
    productName: "LED Energy-Efficient Bulbs",
    category: "Home Improvement",
    description: "Bought energy-saving LED light bulbs",
    basePoints: 50,
  },
  {
    activityType: "qr_scan",
    productName: "Compost Bin Kit",
    category: "Gardening",
    description: "Purchased home composting system",
    basePoints: 100,
  },
  {
    activityType: "qr_scan",
    productName: "Electric Vehicle Accessories",
    category: "Transportation",
    description: "Bought EV charging cable and accessories",
    basePoints: 150,
  },
];

// Regular eco activities (non-purchase)
const regularActivityTemplates = [
  {
    activityType: "tree_planting",
    title: "Tree Planting",
    description: "Planted saplings in community garden",
    basePoints: 100,
  },
  {
    activityType: "recycling",
    title: "Waste Recycling",
    description: "Recycled plastic bottles and containers",
    basePoints: 40,
  },
  {
    activityType: "energy_saving",
    title: "Energy Conservation",
    description: "Reduced household energy consumption",
    basePoints: 60,
  },
  {
    activityType: "transport",
    title: "Sustainable Transport",
    description: "Used bicycle or public transport",
    basePoints: 35,
  },
  {
    activityType: "education",
    title: "Environmental Education",
    description: "Attended sustainability workshop",
    basePoints: 90,
  },
];

// Sample partner companies
const samplePartners = [
  { name: "GreenLife Store", category: "Retail", location: "Lagos, Nigeria" },
  {
    name: "EcoMart Nigeria",
    category: "Supermarket",
    location: "Abuja, Nigeria",
  },
  {
    name: "Sustainable Living Co.",
    category: "Lifestyle",
    location: "Port Harcourt, Nigeria",
  },
  {
    name: "Planet Friendly Shop",
    category: "Online Store",
    location: "Kano, Nigeria",
  },
  {
    name: "Nature's Best",
    category: "Health & Wellness",
    location: "Ibadan, Nigeria",
  },
];

// Function to generate random date within last 45 days
const getRandomDate = () => {
  const start = new Date();
  start.setDate(start.getDate() - 45); // 45 days ago
  const end = new Date();

  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
};

// Function to create sample partners if they don't exist
const createSamplePartners = async () => {
  console.log("🏪 Checking for sample partners...");

  const existingPartners = await Partner.find({});

  if (existingPartners.length === 0) {
    console.log("📝 Creating sample partners...");

    const partnersToCreate = samplePartners.map((partner) => ({
      name: partner.name,
      email: `contact@${partner.name
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[^a-z0-9]/g, "")}.com`,
      category: partner.category,
      location: {
        name: partner.location,
        address: `123 Green Street, ${partner.location}`,
      },
      isActive: true,
      totalScans: 0,
      totalRewards: 0,
    }));

    await Partner.insertMany(partnersToCreate);
    console.log(`✅ Created ${partnersToCreate.length} sample partners`);
  }

  return await Partner.find({ isActive: true });
};

// Function to create sample rewards if they don't exist
const createSampleRewards = async (partners) => {
  console.log("🎁 Checking for sample rewards...");

  const existingRewards = await Reward.find({});

  if (existingRewards.length === 0) {
    console.log("📝 Creating sample rewards...");

    const rewardsToCreate = [];

    // Create rewards for each partner and product
    for (const partner of partners) {
      for (const template of partnerPurchaseTemplates) {
        rewardsToCreate.push({
          title: template.productName,
          description: `Get eco points for purchasing ${template.productName}`,
          points: template.basePoints,
          category: template.category,
          partnerId: partner._id,
          isActive: true,
          maxClaims: 1000, // Allow many claims
          currentClaims: 0,
        });
      }
    }

    await Reward.insertMany(rewardsToCreate);
    console.log(`✅ Created ${rewardsToCreate.length} sample rewards`);
  }

  return await Reward.find({ isActive: true }).populate("partnerId");
};

// Function to seed activities with partner purchases
const seedActivitiesWithPartners = async () => {
  try {
    console.log("🌱 Starting activities seeding with partner purchases...");

    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(
        process.env.MONGO_URI || "mongodb://localhost:27017/ecorewards"
      );
      console.log("📡 Connected to MongoDB");
    }

    // Create sample partners and rewards
    const partners = await createSamplePartners();
    const rewards = await createSampleRewards(partners);

    // Clear existing activities
    console.log("🧹 Clearing existing activities...");
    await Activity.deleteMany({});

    // Get all users
    const users = await User.find({}).select("_id name email points");

    if (users.length === 0) {
      console.log("❌ No users found. Please create users first.");
      return;
    }

    console.log(`👥 Found ${users.length} users. Creating activities...`);

    const createdActivities = [];

    // Create activities for each user
    for (const user of users) {
      // Each user gets 4-10 activities (mix of purchases and regular activities)
      const numActivities = Math.floor(Math.random() * 7) + 4;
      const numPurchases = Math.floor(numActivities * 0.6); // 60% purchases, 40% regular

      console.log(
        `📝 Creating ${numActivities} activities for ${
          user.name
        } (${numPurchases} purchases, ${
          numActivities - numPurchases
        } regular)...`
      );

      // Create purchase activities (QR scans)
      for (let i = 0; i < numPurchases; i++) {
        const reward = rewards[Math.floor(Math.random() * rewards.length)];
        const template = partnerPurchaseTemplates.find(
          (t) => t.productName === reward.title
        );

        if (template && reward) {
          const activity = {
            userId: user._id,
            activityType: "qr_scan",
            title: `Purchased: ${template.productName}`,
            description: `${template.description} from ${reward.partnerId.name}`,
            pointsEarned: reward.points,
            rewardId: reward._id,
            partnerId: reward.partnerId._id,
            location: reward.partnerId.location?.name,
            metadata: {
              productCategory: template.category,
              purchaseType: "partner_purchase",
              storeName: reward.partnerId.name,
            },
            status: "completed",
            createdAt: getRandomDate(),
            updatedAt: getRandomDate(),
          };

          createdActivities.push(activity);
        }
      }

      // Create regular activities
      for (let i = 0; i < numActivities - numPurchases; i++) {
        const template =
          regularActivityTemplates[
            Math.floor(Math.random() * regularActivityTemplates.length)
          ];

        // Add some variation to points (±20%)
        const pointsVariation = Math.floor(template.basePoints * 0.2);
        const finalPoints =
          template.basePoints +
          Math.floor(Math.random() * pointsVariation * 2) -
          pointsVariation;

        const activity = {
          userId: user._id,
          activityType: template.activityType,
          title: template.title,
          description: template.description,
          pointsEarned: Math.max(5, finalPoints),
          metadata: {
            activityCategory: "personal_action",
          },
          status: "completed",
          createdAt: getRandomDate(),
          updatedAt: getRandomDate(),
        };

        createdActivities.push(activity);
      }
    }

    // Insert all activities
    console.log(`💾 Inserting ${createdActivities.length} activities...`);
    await Activity.insertMany(createdActivities);

    // Calculate and update user points
    console.log("🔄 Updating user points based on activities...");

    for (const user of users) {
      const totalActivityPoints = await Activity.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$pointsEarned" } } },
      ]);

      const activityPoints = totalActivityPoints[0]?.total || 0;

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { points: user.points + activityPoints },
        { new: true }
      );

      updatedUser.updateEcoLevel();
      await updatedUser.save();

      console.log(
        `✅ Updated ${user.name}: +${activityPoints} points (total: ${updatedUser.points}, level: ${updatedUser.ecoLevel})`
      );
    }

    // Sync with leaderboard
    console.log("🏆 Syncing with leaderboard...");
    const updatedUsers = await User.find({}).select("_id points");

    for (const user of updatedUsers) {
      await Leaderboard.syncUserPoints(user._id, user.points);
    }

    await Leaderboard.updateAllRankings();

    // Show detailed summary
    const totalActivities = await Activity.countDocuments();
    const purchaseActivities = await Activity.countDocuments({
      activityType: "qr_scan",
    });
    const activitiesByType = await Activity.aggregate([
      { $group: { _id: "$activityType", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    console.log("\n🎉 ACTIVITIES SEEDING WITH PARTNERS COMPLETE!");
    console.log("═══════════════════════════════════════════════");
    console.log(`📊 Total activities created: ${totalActivities}`);
    console.log(`🛒 Partner purchases (QR scans): ${purchaseActivities}`);
    console.log(
      `🌱 Regular eco activities: ${totalActivities - purchaseActivities}`
    );
    console.log(`🏪 Partner companies: ${partners.length}`);
    console.log(`🎁 Available rewards: ${rewards.length}`);

    console.log("\n📈 Activities breakdown:");
    activitiesByType.forEach((type) => {
      console.log(`  ${type._id}: ${type.count} activities`);
    });

    console.log("\n🛍️ Recent partner purchases:");
    const recentPurchases = await Activity.find({ activityType: "qr_scan" })
      .populate("userId", "name")
      .populate("partnerId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    recentPurchases.forEach((activity, index) => {
      const timeAgo = Math.floor(
        (new Date() - activity.createdAt) / (1000 * 60 * 60 * 24)
      );
      console.log(
        `  ${index + 1}. ${activity.userId.name} bought from ${
          activity.partnerId.name
        } - ${activity.pointsEarned} pts (${timeAgo} days ago)`
      );
    });

    console.log("═══════════════════════════════════════════════");
    console.log("🚀 Ready to test the full partner purchase flow!");
    console.log("💡 Users can now scan QR codes from partner purchases!");
  } catch (error) {
    console.error("❌ Error seeding activities with partners:", error);
    process.exit(1);
  }
};

// Run the seed script
const runSeed = async () => {
  await seedActivitiesWithPartners();
  process.exit(0);
};

// Export for use in other files or run directly
if (require.main === module) {
  runSeed();
}

module.exports = seedActivitiesWithPartners;
