// api-gateway.js

const express = require('express');
const bodyParser = require('body-parser');
const { loadPackageDefinition, credentials } = require('@grpc/grpc-js');
const protoLoader = require('@grpc/proto-loader');
const userServiceProtoPath = __dirname + '/shared/protobuf/user.proto'; 
const blogServiceProtoPath = __dirname + '/shared/protobuf/blog.proto';
const commentServiceProtoPath = __dirname + '/shared/protobuf/comment.proto';
const userServicePackageDefinition = protoLoader.loadSync(userServiceProtoPath);
const blogServicePackageDefinition = protoLoader.loadSync(blogServiceProtoPath);
const commentServicePackageDefinition = protoLoader.loadSync(commentServiceProtoPath);
const userServiceProto = loadPackageDefinition(userServicePackageDefinition).user;
const blogServiceProto = loadPackageDefinition(blogServicePackageDefinition).blog;
const commentServiceProto = loadPackageDefinition(commentServicePackageDefinition).comment;

const app = express();
app.use(bodyParser.json());

// Create gRPC client for each microservice
const userServiceClient = new userServiceProto.UserService('localhost:50051', credentials.createInsecure());
const blogServiceClient = new blogServiceProto.BlogService('localhost:50052', credentials.createInsecure());
const commentServiceClient = new commentServiceProto.CommentService('localhost:50053', credentials.createInsecure());

// Define routes
app.get('/user', async (req, res) => {
  // Make gRPC call to user service
  userServiceClient.getUser({}, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(response);
    }
  });
});

app.post('/users', async (req, res) => {
  console.log('Received request body:', req.body);
  userServiceClient.createUser(req.body, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(response);
    }
  });
}
);
// Define routes for blog service
app.get('/blog', async (req, res) => {
    // Make gRPC call to blog service
    blogServiceClient.getBlog({}, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  
  app.post('/blogs', async (req, res) => {
    // Make gRPC call to blog service
    blogServiceClient.createBlog(req.body, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });

  // user creates new blog
app.post('/users/:userId/blogs', async (req, res) => {
  const userId = req.params.userId;
  const { title, content } = req.body;
  
  userServiceClient.createBlogForUser({ userId, title, content }, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(response);
    }
  });
});

  // list all the blogs by the user
  app.get('/blogs/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    console.log('Request URL:', req.url);
    console.log('Request Parameters:', req.params);
    // Make gRPC call to blog service to list blogs by user
    blogServiceClient.listBlogsByUser({ userId: userId }, (err, response) => {
      if (err) {
        console.error('Error from blog service:', err);
        res.status(500).json({ error: err.message });
      } else {
        console.log('Response from blog service:', response);
        res.json(response);
      }
    });
  });

  // List comments by blog
app.get('/blogs/:blogId/comments', async (req, res) => {
  const blogId = req.params.blogId;
  // Make gRPC call to blog service to list comments by blog
  blogServiceClient.listCommentsByBlog({ blogId }, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(response);
    }
  });
});
  
// list all blogs by category
app.get('/blogs/category/:category', async (req, res) => {
  const category = req.params.category;
  // Make gRPC call to blog service to list blogs by category
  blogServiceClient.listBlogsByCategory({ category }, (err, response) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(response);
    }
  });
});
  // Define routes for comment service
  app.get('/comment', async (req, res) => {
    // Make gRPC call to comment service
    commentServiceClient.getComment({}, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });


  
  app.post('/comments', async (req, res) => {
    // Make gRPC call to comment service
    commentServiceClient.createComment(req.body, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  app.put('/blogs/:id', async (req, res) => {
    const blogId = req.params.id;
    // Make gRPC call to blog service
    blogServiceClient.updateBlog({ id: blogId, ...req.body }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  
  // Delete a blog
  app.delete('/blogs/:id', async (req, res) => {
    const blogId = req.params.id;
    // Make gRPC call to blog service
    blogServiceClient.deleteBlog({ id: blogId }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  // Update a comment
app.put('/comments/:id', async (req, res) => {
    const commentId = req.params.id;
    // Make gRPC call to comment service
    commentServiceClient.updateComment({ id: commentId, ...req.body }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  
  // Delete a comment
  app.delete('/comments/:id', async (req, res) => {
    const commentId = req.params.id;
    // Make gRPC call to comment service
    commentServiceClient.deleteComment({ id: commentId }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  // Update a user
app.put('/users/:id', async (req, res) => {
    const userId = req.params.id;
    // Make gRPC call to user service
    userServiceClient.updateUser({ id: userId, ...req.body }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  
  // Delete a user
  app.delete('/users/:id', async (req, res) => {
    const userId = req.params.id;
    // Make gRPC call to user service
    userServiceClient.deleteUser({ id: userId }, (err, response) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(response);
      }
    });
  });
  
  

// Similar routes for blog and comment services

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
