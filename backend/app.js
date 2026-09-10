require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var logger = require('morgan');
const connectDB = require('./config/db');
const swaggerDocs = require('./config/swagger');
const swaggerUi = require('swagger-ui-express');
const cors = require('cors');

/*routes*/
const userRoutes = require('./routes/userRoutes');
const articleRoutes = require('./routes/articleRoutes');
const shelfRoutes = require('./routes/shelfRoutes');
const closetRoutes = require('./routes/closetRoutes');
const shoppingRoutes = require('./routes/buyArticle')



try {
    connectDB();
  } catch (error) {
    console.error('Failed to connect to database:', error);
  }





var app = express();

app.use(cors());

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/users', userRoutes);
app.use('/shelf', shelfRoutes);
app.use('/shopping', shoppingRoutes);
app.use('/closet', closetRoutes);
app.use('/article', articleRoutes)



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

module.exports = app;


const HOST = '0.0.0.0';
const PORT = process.env.PORT || 3000; // DODANO: Definiramo PORT

if (require.main === module && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
    console.log(`📑 Swagger UI available at http://${HOST}:${PORT}/api-docs`);
  });
}