const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const dotenv = require('dotenv');
const { JSDOM } = require('jsdom'); 
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const User = require("./userdb");
const ImageDetails = require("./db")
const app = express();

dotenv.config();

// const corsOptions = {
//    origin: 'https://image2-text-client.vercel.app',
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization'],
// };
//app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


const port = process.env.PORT || 5000;
const mongoose = require("mongoose");

 const connectDB = () => {
    mongoose
      .connect(process.env.MONGO_URI, {
        dbName: "assignment",
      })
      .then((c) => console.log(`DB Connected to ${c.connection.host}`))
      .catch((e) => console.log(e));
  };
  
  connectDB();

const storage = multer.memoryStorage();

// const storage = multer.diskStorage({
//     destination(req, file, callback) {
//       callback(null, "uploads");
//     },
//     filename(req, file, callback) {
    
//       const id2 = Date.now();
//       const extName = file.originalname.split(".").pop();
  
//       callback(null, `${id2}.${extName}`);
//     },
//   });

const upload = multer({ storage});
//blank
app.use(bodyParser.json()); // Parse JSON bodies


const isBold = (element) => {
    const fontSize = parseInt(element['font-size'], 10);
    return fontSize > 12; 
  };




app.get('/',async (req,res) =>{
    res.send("Success");
})

app.post('/upload',upload.single('image'), async (req, res) => {
  try {
   // const imagePath = path.join(__dirname, req.file.path);
   const imageBuffer = req.file.buffer;

    const { data: { hocr,text} } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => console.log(m),
        tessedit_create_hocr: '1',
      });

 // Parse hOCR to identify bold text
 const boldWords = [];
 const parser = new JSDOM(hocr);
 const hocrDocument = parser.window.document;
 const spans = hocrDocument.querySelectorAll('span.ocrx_word');

 spans.forEach((span) => {
   const title = span.getAttribute('title');
   const fontSizeMatch = title.match(/x_size (\d+)/);
   if (fontSizeMatch && isBold({ 'font-size': fontSizeMatch[1] })) {
     boldWords.push(span.textContent);
   }
 });

    const imageDetails = new ImageDetails({
      image: req.file.path,
      text,
      boldWords,
    });

    await imageDetails.save();

    //fs.unlinkSync(imagePath); 
    res.json({ text ,boldWords });
   
  } catch (error) {
    console.error('Error processing image', error);
    res.status(500).send('Error processing image');
  }
});

//Signup endpoint
app.post('/signup', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ message: 'User already exists' });
      }
  
      // Create new user
      user = new User({ email, password });
  
      // Hash password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
  
      // Save user to database
      await user.save();
  
      res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
      console.error('Error in signup:', error);
      res.status(500).json({ message: 'Server error' });
    }
})


  // Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    res.json({ msg: 'Login successful' });

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ msg: 'Login failed' });
  }
});  
    

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
