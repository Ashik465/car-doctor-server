const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.vgwn8xr.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

//verify jwt token

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "Unauthorized Access" });
  }

  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");

    const orderCollection = client.db("carDoctor").collection("checkOutOrders");

    //jwt token

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    // post api for order

    app.post("/addOrder", async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    // get api for order

    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("decoded info : ", decoded);

      if (decoded.email !== req.query.email) {
        return res
          .status(403)
          .send({ error: true, message: "Forbidden Access" });
      }

      let query = {};
      if (req.query?.email) {
        query = { email: req.query.email };
      }
      const cursor = orderCollection.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    // delete api for order

    app.delete("/deleteOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
    });

    // update order api

    app.patch("/updateOrder/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedOrder = req.body;
      const updateDoc = {
        $set: {
          status: updatedOrder.status,
        },
      };
      const result = await orderCollection.updateOne(query, updateDoc);
      res.json(result);
    });

    // all services get api
    app.get("/services", async (req, res) => {
      const sort = req.query.sort;
      const search = req.query.search;

      const cursor = serviceCollection.find({ title: { $regex: search, $options: "i" } });
      const services = await cursor.toArray();

      services.forEach((service) => {
        service.price = parseFloat(service.price);
      });

      // Sort by price in ascending or decending order based on the query parameter
      if (sort === "desc") {
        services.sort((a, b) => b.price - a.price);
      }
      if (sort === "asc") {
        services.sort((a, b) => a.price - b.price);
      }

      res.send(services);
    });

    // single service get api

    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, description: 1, img: 1 },
      };
      const service = await serviceCollection.findOne(query, options);
      res.json(service);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
