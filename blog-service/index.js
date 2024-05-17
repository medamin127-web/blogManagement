import { loadPackageDefinition, Server, ServerCredentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = join(__dirname, '/../shared/protobuf/blog.proto');
const packageDefinition = loadSync(PROTO_PATH);
const blogProto = loadPackageDefinition(packageDefinition).blog;

const server = new Server();
const url = 'mongodb://localhost:27017';
const dbName = 'blog_management';

server.addService(blogProto.BlogService.service, {
  GetBlog: getBlog,
  CreateBlog: createBlog,
  UpdateBlog: updateBlog,
  DeleteBlog: deleteBlog,
  ListBlogsByUser: listBlogsByUser,
  ListCommentsByBlog: listCommentsByBlog, 
  ListBlogsByCategory:listBlogsByCategory,
});

async function getBlog(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    const blog = await collection.findOne({ blogId: call.request.blogId });
    callback(null, blog);
  } catch (error) {
    console.error('Error getting blog:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function createBlog(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    const result = await collection.insertOne(call.request);
    
    if (result.acknowledged) {
      const blogResponse = {
        blogId: result.insertedId.toString(),
        title: call.request.title,
        content: call.request.content,
        userId: call.request.userId,
        category: call.request.category // Include the category property in the response
      };
      callback(null, blogResponse);
    } else {
      callback(new Error('Blog insertion failed'), null);
    }
  } catch (error) {
    console.error('Error creating blog:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}


async function updateBlog(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    const result = await collection.findOneAndUpdate(
      { blogId: call.request.blogId },
      { $set: call.request },
      { returnOriginal: false }
    );
    callback(null, result.value);
  } catch (error) {
    console.error('Error updating blog:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function deleteBlog(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    const result = await collection.findOneAndDelete({ blogId: call.request.blogId });
    callback(null, result.value);
  } catch (error) {
    console.error('Error deleting blog:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}
async function listBlogsByUser(call, callback) {
  const userId = call.request.userId;
  console.log('Received userId:', userId);
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    
    // Find blogs by userId
    const blogs = await collection.find({ userId }).toArray();

    // Construct the response
    const blogResponses = blogs.map(blog => ({
      blogId: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      userId: blog.userId
    }));

    const response = { blogs: blogResponses };
    callback(null, response);
  } catch (error) {
    console.error('Error listing blogs by user:', error);
    callback(error, null);
  } finally {
    // Close the MongoDB client connection
    client.close();
  }
}
async function listCommentsByBlog(call, callback) {
  const blogId = call.request.blogId;
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    
    // Find comments by blogId
    const comments = await collection.find({ blogId }).toArray();

    // Construct the response
    const commentResponses = comments.map(comment => ({
      commentId: comment._id.toString(),
      content: comment.content,
      userId: comment.userId
    }));

    const response = { comments: commentResponses };
    callback(null, response);
  } catch (error) {
    console.error('Error listing comments by blog:', error);
    callback(error, null);
  } finally {
    // Close the MongoDB client connection
    client.close();
  }
}
async function listBlogsByCategory(call, callback) {
  const category = call.request.category;
  const client = new MongoClient(url);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('blogs');
    
    // Find blogs by category
    const blogs = await collection.find({ category }).toArray();

    // Construct the response
    const blogResponses = blogs.map(blog => ({
      blogId: blog._id.toString(),
      title: blog.title,
      content: blog.content,
      userId: blog.userId,
      category: blog.category
    }));

    const response = { blogs: blogResponses };
    callback(null, response);
  } catch (error) {
    console.error('Error listing blogs by category:', error);
    callback(error, null);
  } finally {
    // Close the MongoDB client connection
    client.close();
  }
}

const PORT = process.env.PORT || 50052;
server.bindAsync(`0.0.0.0:${PORT}`, ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Error binding server:', error);
  } else {
    console.log(`Blog Service running on port ${port}`);
    server.start();
  }
});
