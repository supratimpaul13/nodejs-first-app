import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

mongoose.connect('mongodb://localhost:27017', {
    dbName: "backend",
})
    .then(() => console.log("DataBase Conneccted"))
    .catch((e) => console.log(e))


//schema(structure) is data will store a what form should be in JSON format
const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
});


//model is a fancy way of saying collection
const User = mongoose.model('User', UserSchema);


const app = express();

// const users = [];

//using middlewares
app.use(express.static(path.join(path.resolve(), 'public')))
app.use(express.urlencoded({ extended: true })); //with this we can access the data post from the from
app.use(cookieParser());

app.set('view engine', 'ejs')

//we made a middleware
const isAuthenticated = async (req, res, next) => {

    const { token } = req.cookies;

    if (token) {
        // res.render('logout');

        const decoded = jwt.verify(token, "sgduhghsdlighifddsf");

        req.user = await User.findById(decoded._id);

        next() //this will forward it to the next hander
    }
    else {

        res.redirect("/login");
    }

}


app.get("/", isAuthenticated, (req, res) => {
    console.log(req.user);
    res.render("logout", { name: req.user.name });
})

app.get("/login", (req, res) => {
    res.render("login")
})

app.get("/register", (req, res) => {
    res.render("register");
})

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
        res.redirect("/register");
    }

    // const isMatch = user.password === password;
    const isMatch = await bcrypt.compare(password, user.password);
    let message = "";

    if (!isMatch) {
        return res.render("login", {email, message: "Incorrect password" })
    }

    const token = jwt.sign({ _id: user._id }, "sgduhghsdlighifddsf");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");

})

app.post("/register", async (req, res) => {

    const { name, email, password } = req.body;

    let user = await User.findOne({ email });

    if (user) {
        return res.redirect('/login');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = await User.create({
        name,
        email,
        password: hashedPassword,
    });

    const token = jwt.sign({ _id: user._id }, "sgduhghsdlighifddsf");

    res.cookie("token", token, {
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 1000)
    });
    res.redirect("/");


})

app.get("/logout", (req, res) => {
    res.cookie("token", null, {
        httpOnly: true,
        expires: new Date(Date.now()),
    });
    res.redirect("/");
})

app.listen(5000, () => {
    console.log("Server is working !");
})