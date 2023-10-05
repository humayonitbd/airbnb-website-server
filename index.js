const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require('jsonwebtoken');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;


//middle ware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.epqkzkd.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// console.log(uri)
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// jwt = "JhbGciOiJSUzI1NiIsImtpZCI6IjlhNTE5MDc0NmU5M2JhZTI0OWIyYWE3YzJhYTRlMzA2M2UzNDFlYzciLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiTWQgSHVtYXlvbiBGb3JpZCIsInBpY3R1cmUiOiJodHRwczovL2kuaWJiLmNvLzY0bUNOTFcvcHJvZmVzc2lvbmFsLXBob3RvLnBuZyIsImlzcyI6Imh0dHBzOi8vc2VjdXJldG9rZW4uZ29vZ2xlLmN"


//verify jwt
const verifyJwt=(req, res, next)=>{
    const authHeader = req.headers.authorization;

    if(!authHeader){
        return res.status(401).send('unauthorized access!')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_JWT_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbiden access'})
        }
        req.decoded = decoded;
        next();
    })


}




async function run() {
  try {
    await client.connect();

    const categoryCollection = client.db("airbnbDatabase").collection("allCategory");
    const allProductCollection = client.db("airbnbDatabase").collection("allProductData");
    const allUsersCollection = client.db("airbnbDatabase").collection("allUsers");
    const bookingPlaceCollection = client.db("airbnbDatabase").collection("bookingPlace");
    const wishlistsCollection = client.db("airbnbDatabase").collection("wishlists");
    const reportsCollection = client.db("airbnbDatabase").collection("reportPlaces");

    

    //all Users data
    app.post('/users', async(req, res)=>{
      const body = req.body;
      // console.log(body);
     const allUsers = await allUsersCollection.insertOne(body);
        res.send(allUsers);
    })
    
    //google login
        app.put('/googleUsers', async(req, res)=>{
            const user = req.body;
            // console.log(user)
            const email = req.body.email;
            const filter = {email: email};
                const options = { upsert: true };
                const updatedDoc = {
                    $set:user,
                }

                const googleLoign = await allUsersCollection.updateOne(filter, updatedDoc, options)
                 res.send({email})
        })

    //all Category data
    app.get('/allCategory', async(req, res)=>{
        // const query = {};
        const cursor = categoryCollection.find({});
        const categorys = await cursor.toArray();
        res.send(categorys);

    })
    //all Product data
    app.get('/allProductData', async(req, res)=>{
        // const query = {};
        const cursor = allProductCollection.find({});
        const allProductData = await cursor.toArray();
        res.send(allProductData);

    })
    

    //single  Product get by id
    app.get('/singleProductDataDetails/:id', async(req, res)=>{
      const id = req.params.id;
      // console.log(id)
      const query = {_id: new ObjectId(id)};
        const singleProduct = await allProductCollection.findOne(query);
        res.send(singleProduct);

    })

    

//single category product get 
    app.get('/singleCategoryData/:id', async(req, res)=>{
        const category = req.params.id;
        // console.log(category);
            const query = {category: category}
            const result = await allProductCollection.find(query).toArray();
            res.send(result)

    })

//search query filtering
    app.get('/searchData', async(req, res)=>{
        const location = req.query.location;
        const adults = parseInt(req.query.adults);
        const children = parseInt(req.query.children);
        const dateProduct = req.query.dateTimeSet;
        // console.log(location, adults, children, dateProduct);
            const query = {location: location, adults: adults, children: children, date: dateProduct};
            if(query){
              const result = await allProductCollection.find(query).toArray();
              return res.send(result);
            }
        

    })


//search query filtering-222222
// http://localhost:5000/searchFillter/?modalBtn=${modalBtn}&roomState=${roomState}&bedState=${bedState}&bathroomState=${bathroomState}&propertyState=${propertyState}
    app.get('/searchFillter', async(req, res)=>{
        const modalBtn = parseInt(req.query.modalBtn);
        const roomState = parseInt(req.query.roomState);
        const bedState = parseInt(req.query.bedState);
        const bathroomState = parseInt(req.query.bathroomState);
        const propertyState = req.query.propertyState;
        // console.log(req.query);
            const query = {Bathrooms: bathroomState, Beds: bedState, Bedrooms: roomState, propertyType: propertyState, typePlace: modalBtn};
            if(query){
              const result = await allProductCollection.find(query).toArray();
              return res.send(result);
            }
        

    })

    ///booking api handle start

    //booking product data post 
        app.post('/bookingPlace', async(req, res)=>{
            const body = req.body;
              const bookingPlace = await bookingPlaceCollection.insertOne(body);
              res.send(bookingPlace)

        })


        //booking product data get by user email 
        app.get('/bookingPlaces/:id', verifyJwt, async(req, res)=>{
          const email = req.params.id;
            // console.log(email)
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden accesss'})
            }
            const query = {email: email}
            const bookingPlace = await bookingPlaceCollection.find(query).toArray();
            res.send(bookingPlace);
        })

        //booking product data delete by id
        app.delete('/bookingPlacesDelete/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const bookingDeletePlace = await bookingPlaceCollection.deleteOne(query);
            res.send(bookingDeletePlace);
        })

        app.put('/bookingPayment/:id', async(req, res)=>{
          const id = req.params.id;
          const updateInfo = req.body;
          const mainProductID = req.body.bookingProductID;
          // console.log(updateInfo, mainProductID)
            // console.log(mainProductID)
            const filter = {_id: new ObjectId(id)};
            const filter2 = {_id: new ObjectId(mainProductID)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: updateInfo,
                    
            }
            const updatedDoc2 = {
                $set: {
                  payment: true
                },
                    
            }
            const paymentMainProductResult = await allProductCollection.updateOne(filter2, updatedDoc2, options);
            const paymentResult = await bookingPlaceCollection.updateOne(filter, updatedDoc, options);
            res.send(paymentResult);
        })

 ///booking api handle end


  ///wishlist api handle start

  //wishlist product data post 
        app.post('/wishlistPlace', async(req, res)=>{
            const body = req.body;
              const wishlist = await wishlistsCollection.insertOne(body);
              res.send(wishlist)

        })


        //wishlist product data get by user email 
        app.get('/wishlistPlace/:id', async(req, res)=>{
          const email = req.params.id;
            // console.log(email)
            const query = {email: email}
            const wishlist = await wishlistsCollection.find(query).toArray();
            res.send(wishlist);
        })

        //wishlist product data delete by id
        app.delete('/wishlistPlace/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const wishlistDeletePlace = await wishlistsCollection.deleteOne(query);
            res.send(wishlistDeletePlace);
        })

        //wishlist product data update by id
        app.put('/wishlistPlacePayment/:id', async(req, res)=>{
          const id = req.params.id;
          const updateInfo = req.body;
          const mainProductID = req.body.wishlistProductID;
          // console.log("wishlist body",updateInfo)
            // console.log("mainProductID",mainProductID)
            const filter = {_id: new ObjectId(id)};
            const filter2 = {_id: new ObjectId(mainProductID)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: updateInfo,
                    
            }
            const updatedDoc2 = {
                $set: {
                  payment: true
                },
                    
            }
            const paymentMainProductResult = await allProductCollection.updateOne(filter2, updatedDoc2, options);
            const paymentResult = await wishlistsCollection.updateOne(filter, updatedDoc, options);
            res.send(paymentResult);
        })

 ///wishlist api handle end

  ///reportPlace api handle start

  //reportPlace  data post 
        app.post('/reportPlace', async(req, res)=>{
            const body = req.body;
            const id = req.body.reportProductID;
            const filter = {_id: new ObjectId(id)};
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                  report: true
                },
                    
            }
            const reportedPlace = await allProductCollection.updateOne(filter, updatedDoc, options);
              const reportPlace = await reportsCollection.insertOne(body);
              res.send(reportPlace)

        })


        //wishlist product data get by user email 
        app.get('/reportPlace/:id', async(req, res)=>{
          const email = req.params.id;
            // console.log(email)
            const query = {email: email}
            const reportPlace = await reportsCollection.find(query).toArray();
            res.send(reportPlace);
        })

        //wishlist product data delete by id
        app.delete('/reportPlace/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const reportDeletePlace = await reportsCollection.deleteOne(query);
            res.send(reportDeletePlace);
        })

      
        ///wishlist api handle end



        ///admin role implement 
        app.get('/users/admin/:email', async(req, res)=>{
            const email = req.params.email;
            // console.log(email)
            const filter = {email: email}
            const user = await allUsersCollection.findOne(filter);
            res.send({isAdmin: user.role})
        })

 


    //admin api start

    //users get api
    app.get('/allusers', async(req, res)=>{
            // const query = {};
            const cursor = allUsersCollection.find({});
            const allUsers = await cursor.toArray();
            res.send(allUsers);

        })

    //users delete api
    app.delete('/allusers/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)};
            const deleteUsers = allUsersCollection.deleteOne(query);
            console.log("deleteUsers",deleteUsers)
            res.send(deleteUsers);

        })


        //all place data all product data
        app.get('/allPlaceData', async(req, res)=>{
        // const query = {};
        const cursor = allProductCollection.find({});
        const allPlaceData = await cursor.toArray();
        res.send(allPlaceData);
    })

    //all place data delete api
        app.delete('/allPlaceData/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const deletePlace = await allProductCollection.deleteOne(query);
            res.send(deletePlace);
        })

        //all booked place data 
        app.get('/allBookedPlaceData/:id', async(req, res)=>{
          const id = req.params.id;
          const name = JSON.parse(id)
        const query = {payment: name};
        const cursor = allProductCollection.find(query);
        const allBookedPlaceData = await cursor.toArray();
        res.send(allBookedPlaceData);
    })

    //all booked place data delete api
        app.delete('/allBookedPlaceData/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const deleteBookedPlace = await allProductCollection.deleteOne(query);
            res.send(deleteBookedPlace);
        })

        //all booked place data 
        app.get('/allReportPlaceData/:id', async(req, res)=>{
          const id = req.params.id;
          const name = JSON.parse(id)
        const query = {report: name};
        const cursor = allProductCollection.find(query);
        const allReportPlaceData = await cursor.toArray();
        res.send(allReportPlaceData);
    })

    //all booked place data delete api
        app.delete('/allReportPlaceData/:id', async(req, res)=>{
          const id = req.params.id;
            // console.log(id)
            const query = {_id: new ObjectId(id)};
            const deleteReportPlace = await allProductCollection.deleteOne(query);
            res.send(deleteReportPlace);
        })

    //admin api end


    // jwt token get
        app.get('/jwt', async(req, res)=>{
            const email = req.query.email;
            const query = {email: email}
            const user = await allUsersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email}, process.env.ACCESS_JWT_TOKEN)
                return res.send({accessToken: token});
            }
            res.status(403).send({jwttoken: ''})
        })




    await client.db("admin").command({ ping: 1 });
    console.log(" You successfully connected to MongoDB!");


  } catch (error){
    console.log(error.message)
  }
}
run().catch(console.dir);






app.get('/', async(req, res)=>{
    res.send('server is running...')
})











app.listen(port,()=>{
    console.log('your server running port is ', port)
})