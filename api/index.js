const express = require('express');
const connectToMongoDB = require('../db');
const cors = require('cors'); // Import jsonwebtoken


try {
    require('dotenv').config();

    if (!process.env.JWT_SECRET) {
        process.env.JWT_SECRET = "your_secret_key_here";
    }



    //expresss
    const app = express();
    app.use(cors());
    const jsonMiddleware = (req, res, next) => {
        if (req.url.startsWith('/image')) {
            next();
        } else {
            express.json()(req, res, next);
        }
    };
    app.use(jsonMiddleware);





    const ensureDbConnection = async (req, res, next) => {
        try {
            if (!global.dbConnection) {
                console.log('Connecting to MongoDB...');
                global.dbConnection = await connectToMongoDB();
            }
            else {
                console.log('Already connected to MongoDB...');
            }
            next();
        } catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            res.status(500).send('Database connection error');
        }
    };

    // Apply middleware globally
    app.use(ensureDbConnection);



    //ROUTE here
    app.get('/', (req, res) => {
        res.send('<h1>Welcome to My Fertilityhostan</h1><p></p>');
    });


    // Register Route
    app.post('/register', RegisterationController.recipientRegister);

    app.post('/register-recipient', RegisterationController.recipientRegister);

    // Login Route
    app.post('/login', LoginControler);

    //(Profile)
    app.get('/profile', VerifyToken, ProfileController);


    app.use(VerifyToken)

    // loggeddin user routes
    const authUserRouter = express.Router();
    const authMiddlewares = [
        PermissionCheck(['admin', 'donor', 'recipient'])
    ];
    //Get users
    authUserRouter.get('/users', ...authMiddlewares, UsersController.getAllUsers);
    authUserRouter.get("/user-data/:id", ...authMiddlewares, UsersController.getUserData)
    authUserRouter.get("/user-data/:id/:attribute/", ...authMiddlewares, UsersController.getUserData)


    // Set up file upload handling with Multer
    const storage = multer.memoryStorage();
    const upload = multer({ storage: storage });
    authUserRouter.post('/image/upload', ...authMiddlewares, upload.single('image'), ImagesController.uploadImage);

    app.use(authUserRouter)





    // Start the server
    const startServer = async () => {
        try {
            await connectToMongoDB();
            app.listen(5000, () => {
                console.log('Server is running on port 5000');
            });

            process.on('uncaughtException', async (error) => {
                console.error('Uncaught exception occurred:', error);
                console.log('Closing MongoDB connection...');
                await global.dbConnection.disconnect();
            });
        } catch (error) {
            console.error('Failed to start the server:', error);
        }
    };

    startServer();

    module.exports = app;
}
catch (error) {
    console.dir(error);
}


