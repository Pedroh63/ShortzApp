const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const session = require("express-session");
const flash = require("connect-flash");

const indexRouter = require('./routes/index');
const userRoutes = require('./modules/user/userRoutes');
var videoRoutes = require("./modules/video/videoRoutes");

const app = express();
const expressLayout = require("express-ejs-layouts");


// view engine setup
app.set("views", path.join(__dirname, "views/pages"));         
app.set("layout", path.join(__dirname, "views/layouts/main")); 
app.use(expressLayout);                                      
app.set("view engine", "ejs");

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'Mensagem',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24}
}));
app.use(flash());
app.use((req, res, next) => {
  res.locals.messages = req.flash();
  res.locals.user = req.session.user || null;
  next();
})
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(indexRouter);
app.use(userRoutes);
app.use(videoRoutes);

 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
const sequelize = require('./config/database.js');
const user = require('./modules/user/userModel.js');
const video = require ("./modules/video/videoModel");
sequelize.sync({ alter: true })
  .then(() => console.log('Banco de dados sincronizado!'))
  .catch(err => console.error('Erro ao sincronizar banco:', err));

module.exports = app;