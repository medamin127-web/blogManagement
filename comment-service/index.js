import { loadPackageDefinition, Server, ServerCredentials } from '@grpc/grpc-js';
import { loadSync } from '@grpc/proto-loader';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PROTO_PATH = join(__dirname, '/../shared/protobuf/comment.proto');
const packageDefinition = loadSync(PROTO_PATH);
const commentProto = loadPackageDefinition(packageDefinition).comment;

const server = new Server();
const url = 'mongodb://localhost:27017';
const dbName = 'blog_management';

server.addService(commentProto.CommentService.service, {
  GetComment: getComment,
  CreateComment: createComment,
  UpdateComment: updateComment,
  DeleteComment: deleteComment,
});

async function getComment(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    const comment = await collection.findOne({ commentId: call.request.commentId });
    callback(null, comment);
  } catch (error) {
    console.error('Error getting comment:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function createComment(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    const result = await collection.insertOne(call.request);

    if (result.acknowledged) {
      // Create a response object with the inserted comment's data
      const commentResponse = {
        commentId: result.insertedId.toString(),
        content: call.request.content,
        userId: call.request.userId,
        blogId: call.request.blogId,
      };
      callback(null, commentResponse);
    } else {
      callback(new Error('Comment insertion failed'), null);
    }
  } catch (error) {
    console.error('Error creating comment:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}


async function updateComment(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    const result = await collection.findOneAndUpdate(
      { commentId: call.request.commentId },
      { $set: call.request },
      { returnOriginal: false }
    );
    callback(null, result.value);
  } catch (error) {
    console.error('Error updating comment:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

async function deleteComment(call, callback) {
  const client = new MongoClient(url);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('comments');
    const result = await collection.findOneAndDelete({ commentId: call.request.commentId });
    callback(null, result.value);
  } catch (error) {
    console.error('Error deleting comment:', error);
    callback(error, null);
  } finally {
    client.close();
  }
}

const PORT = process.env.PORT || 50053;
server.bindAsync(`0.0.0.0:${PORT}`, ServerCredentials.createInsecure(), (error, port) => {
  if (error) {
    console.error('Error binding server:', error);
  } else {
    console.log(`Comment Service running on port ${port}`);
    server.start();
  }
});
