const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const port = process.env.PORT || 7000
// middleware
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ihnag.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {

    try {
        await client.connect();
        const database = client.db('apartment_sale')
        const apartmentCollection = database.collection('apartments')

        //post api
        app.post('/apartments', async (req, res) => {
            const apartments = req.body
            console.log("hit the post api", apartments);
            const result = await apartmentCollection.insertOne(apartments)
            console.log(result);
            res.json(result)
        })

        // get api 
        app.get('/apartments', async (req, res) => {
            const cursor = apartmentCollection.find({});
            const apartments = await cursor.toArray();
            res.send(apartments);
        })

        // get single product 
        app.get('/apartments/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const findApartment = await apartmentCollection.findOne(query);
            res.json(findApartment)
        })

        //order collection
        const orderDatabase = client.db('apartment_sale')
        const orderCollection = orderDatabase.collection('orders')

        // post order api 
        app.post('/addOrderInfo', async (req, res) => {
            console.log(req.body);
            const result = await orderCollection.insertOne(req.body)
            res.json(result)
        })


        // get order
        app.get('/orders', async (req, res) => {
            const result = await orderCollection.find({}).toArray()
            res.json(result)
        })

        // payment info 
        app.get("/orders/:id", async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }

            const result = await orderCollection.findOne(query)
            res.json(result);
        })

        //payment info
        app.post('/create-payment-intent', async (req, res) => {
            const paymentInfo = req.body;
            const amount = paymentInfo.price * 100;
            const paymentIntent = await stripe.paymentIntents.create({
                currency: "usd",
                amount: amount,
                automatic_payment_methods: ['card']
            })
            res.json({ clientSecret: paymentIntent.client_secret })
        })
    }
    finally {
        // await client.close()
    }
}

run().catch(console.dir)



app.get('/', (req, res) => {
    res.send('Hello apartment_seller!')
})

app.listen(port, () => {
    console.log(`listening on port ${port}`)
})