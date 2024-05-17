import { loadPackageDefinition, Server, ServerCredentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { MongoClient } from 'mongodb';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { credentials } from '@grpc/grpc-js';

// Convert __filename and __dirname to ES module equivalents
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = join(__dirname, '/../shared/protobuf/user.proto');
const BLOG_PROTO_PATH = join(__dirname, '/../shared/protobuf/blog.proto');
const packageDefinition = loadSync(PROTO_PATH);
const blogPackageDefinition = loadSync(BLOG_PROTO_PATH);
const userProto = loadPackageDefinition(packageDefinition).user;
const blogProto = loadPackageDefinition(blogPackageDefinition).blog;

const server = new Server();
const url = 'mongodb://localhost:27017';
const dbName = 'blog_management';

// Create gRPC client for blog service
const blogServiceClient = new blogProto.BlogService('localhost:50052', credentials.createInsecure());

server.addService(userProto.UserService.service, {
  GetUser: getUser,
  CreateUser: createUser,
  UpdateUser: updateUser,
  DeleteUser: deleteUser,
  CreateBlogForUser: createBlogForUser,
});

async function getUser(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('users');
    const user = await collection.findOne({ userId: call.request.userId });
    callback(null, user);
  } catch (error) {
    console.error('Error getting user:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function createUser(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('users');
    const result = await collection.insertOne(call.request);
    
    if (result.acknowledged) {
      // Create a response object with the inserted user's data
      const userResponse = {
        userId: result.insertedId.toString(),
        username: call.request.username,
        email: call.request.email,
      };
      callback(null, userResponse);
    } else {
      callback(new Error('User insertion failed'), null);
    }
  } catch (error) {
    console.error('Error creating user:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function createBlogForUser(call, callback) {
  const { userId, title, content } = call.request;
  
  // Make gRPC call to blog service to create the blog
  blogServiceClient.createBlog({ userId, title, content }, (err, response) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, response);
    }
  });
}

async function updateUser(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('users');
    const result = await collection.findOneAndUpdate(
      { userId: call.request.userId },
      { $set: call.request },
      { returnOriginal: false }
    );
    callback(null, result.value);
  } catch (error) {
    console.error('Error updating user:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function deleteUser(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('users');
    const result = await collection.findOneAndDelete({ userId: call.request.userId });
    callback(null, result.value);
  } catch (error) {
    console.error('Error deleting user:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

const PORT = process.env.PORT || 50051;
server.bindAsync(`0.0.0.0:${PORT}`, ServerCredentials.createInsecure(), () => {
  console.log(`User Service running on port ${PORT}`);
  server.start();
});
