Project Architecture:
blog-management-app/
  ├── user-service/
  │   ├── index.js
  │   ├── package.json
  │   └── ...
  ├── blog-service/
  │   ├── index.js
  │   ├── package.json
  │   └── ...
  ├── comment-service/
  │   ├── index.js
  │   ├── package.json
  │   └── ...
  ├── shared/
  │   └── protobuf/
  │       ├── user.proto
  │       ├── blog.proto
  │       └── comment.proto
  ├── README.md

cd blog-management-app
cd user-service
node index.js

cd blog-service
node index.js

cd comment-service
node index.js

node apigateway.js

1 - We created ProtoBuff code for each service to define the schema 
2 - We created the services code using grpc 
3 - We created The API Gateway for the services communication and API methods 

