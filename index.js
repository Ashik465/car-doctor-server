const express = require('express')
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port =process.env.PORT || 5000

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
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const serviceCollection = client.db("carDoctor").collection("services");

    const orderCollection = client.db("carDoctor").collection("checkOutOrders");



    // post api for order
      
    app.post('/addOrder', async(req, res) => {
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.json(result);
    })


    // get api for order

    app.get('/orders', async(req, res) => {

        const cursor = orderCollection.find();
        const orders = await cursor.toArray();
        res.send(orders);

        })




    // all services get api 

    app.get('/services', async(req, res) => {
       
        const cursor = serviceCollection.find();
        const services = await cursor.toArray();
        res.send(services);

      })

      // single service get api

        app.get('/services/:id', async(req, res) => {

          const id = req.params.id;
          const query = {_id: new ObjectId(id)};
           const options  = {
                projection: {  title: 1, price: 1, description: 1, img: 1 }, 
            };
            const service = await serviceCollection.findOne(query,options);
            res.json(service);
        } )





    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})