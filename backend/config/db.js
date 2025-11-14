const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function connectDB(uri) {
  try {
    // Configure Mongoose for optimized performance
    mongoose.set('bufferCommands', false);
    
    // Start MongoDB Memory Server if no URI provided
    if (!uri) {
      mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log('Using MongoDB Memory Server');
    }
    
    const connection = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4
    });

    // Add connection error handler
    connection.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    // Add reconnection handler
    connection.connection.on('disconnected', () => {
      console.log('MongoDB disconnected. Attempting to reconnect...');
    });

    connection.connection.on('connected', () => {
      console.log('MongoDB connected successfully');
    });

    return connection;
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
}

// Cleanup function to stop MongoDB Memory Server
async function closeDB() {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
}

// Handle process termination
process.on('SIGTERM', closeDB);
process.on('SIGINT', closeDB);

module.exports = { connectDB, closeDB };
