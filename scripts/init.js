/** @format */

const AWS = require("aws-sdk");

AWS.config.update({
  region: "us-west-2",
  endpoint: "http://localhost:8000",
});

const dynamoDB = new AWS.DynamoDB();

const createUsers = async () => {
  var params = {
    TableName: "Users",
    KeySchema: [{ AttributeName: "user_id", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "user_id", AttributeType: "S" }],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  dynamoDB.createTable(params, (err, data) => {
    if (err) {
      console.log(`Error creating table. ${JSON.stringify(err)}`);
    } else {
      console.log(`Table created: Users. ${JSON.stringify(data)}`);
    }
  });
};

const createEventsTable = async () => {
  var params = {
    TableName: "Events",
    KeySchema: [
      { AttributeName: "user_id", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  dynamoDB.createTable(params, (err, data) => {
    if (err) {
      console.log(`Error creating table. ${err}`);
    } else {
      console.log(`Table created: Users`);
    }
  });
};

const createPointsAggregateTable = async () => {
  const params = {
    TableName: "PointsAggregate",
    KeySchema: [
      { AttributeName: "user_id", KeyType: "HASH" },
      { AttributeName: "timestamp", KeyType: "RANGE" },
    ],
    AttributeDefinitions: [
      { AttributeName: "user_id", AttributeType: "S" },
      { AttributeName: "timestamp", AttributeType: "S" },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  };
  dynamoDB.createTable(params, (err, data) => {
    if (err) {
      console.log(`Error creating table. ${err}`);
    } else {
      console.log(`Table created: PointsAggregate`);
    }
  });
};

// const init = async () => {
//   // console.log(JSON.stringify(tables));
//   await createUsers();
//   await createEventsTable();
//   // dynamoDB.executeStatement();
// };

const clearTables = async () => {
  const tables = await dynamoDB
    .listTables()
    .promise()
    .then((err, stuff) => {
      console.log("found " + JSON.stringify(res));
    });
  if (tables?.TableNames.include("Users")) {
    await dynamoDB
      .deleteTable({ TableName: "Users" })
      .promise()
      .then((err, res) => {
        console.log(res);
      });
  }
  if (tables?.TableNames.include("Events")) {
    await dynamoDB
      .deleteTable({ TableName: "Events" })
      .promise()
      .then((err, res) => {
        console.log(res);
      });
  }
  if (tables?.TableNames.include("PointsAggregate")) {
    await dynamoDB
      .deleteTable({ TableName: "PointsAggregate" })
      .promise()
      .then((err, res) => {
        console.log(res);
      });
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args[0] == "clear") {
    await clearTables();
  } else if (args[0] == "create") {
    await createUsers();
    await createEventsTable();
    await createPointsAggregateTable();
  } else {
    console.log("do nothing");
  }
};

main();
