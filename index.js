const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose"); // Import mongoose at the top
const User = require("./db/users");
const Product = require("./db/Product");

app.use(express.json());
app.use(cors());

const jwt = require('jsonwebtoken')
const jwtKey = 'e-comm'

require("./db/config");

function verifyToken(req, res, next) {
  let token = req.headers['authorization'];
  if (token) {
    token = token.split(' ')[1];
    console.warn(token)
    jwt.verify(token, jwtKey, (err, decoded) => {
      if (err) {
        res.status(403).json({ result: "Invalid token" });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  } else {
    res.status(401).json({ result: "Token not provided" });
  }
}

// route for the signup
app.post("/register", async (req, res) => {
  let user = new User(req.body);
  let result = await user.save();
  result = result.toObject();
  delete result.password;
  // res.send(result);
  
        // jwt token 
        jwt.sign({ result }, jwtKey, { expiresIn: '2h' }, (err, token) => {
          if (err) {
            res.send({ result: 'something went wrong' });
          }
          res.send({ result, auth: token }); // Send the token here, combined with user data
        });
});

// route for the login
app.post("/login", async (req, res) => {
  console.log(req.body);
  if (req.body.password && req.body.email) {
    let user = await User.findOne(req.body).select("-password");
    if (user) {
      // jwt token 
      jwt.sign({ user }, jwtKey, { expiresIn: '2h' }, (err, token) => {
        if (err) {
          res.send({ result: 'something went wrong, please try after soemtime' });
        }
        res.send({ user, auth: token }); // Send the token here, combined with user data
      });

    } else {
      res.send({ result: "no user Found" });
    }
  } else {
    res.send({ result: "no user Found" });
  }
});



app.post("/add-poduct", verifyToken, (req, res) => {
  let product = new Product(req.body)
  let result = product.save()
  res.send(req.body);
});

app.get('/products', verifyToken, async (req, res)=>{
    let products = await Product.find()
    if(products.length > 0)
    {
        res.send(products)
    }else{
        res.send({result:"no product found"})
    }
})

app.delete('/product/:id', verifyToken, async (req, res)=>{
    const result = await Product.deleteOne({_id:req.params.id})
    res.send(result)
})

// app.get('/product/:id', async (req, res) => {
//   let result = await Product.findOne({_id:req.params.id})
//   if(result){
//     res.send(result)
//   }else{
//     res.send({result:"product not found"})
//   }
// });

app.get('/product/:id', verifyToken, async (req, res) => {
  try {
    let result = await Product.findOne({ _id: req.params.id });

    if (result) {
      res.status(200).json(result);
    } else {
      res.status(404).json({ error: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});


app.put('/product/:id',verifyToken, async (req, res) => {
  try {
    let result = await Product.updateOne(
      { _id: req.params.id },
      { $set: req.body }
    );

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send({ result: "Internal Server Error" });
  }
});



app.get('/search/:key',verifyToken, async (req, res) => {
  let result = await Product.find(
    {
      "$or":[
        {name: {$regex:req.params.key}},

        {company: {$regex:req.params.key}},

        {category: {$regex:req.params.key}},
      ]
    })
    res.send(result)
})

app.listen(4000, () => {
  console.log("Server is running at http://localhost:4000");
});
