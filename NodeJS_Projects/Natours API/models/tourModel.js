//validators of schema run automatic when calling .create()
//and also on update, (beacuse we defined them to on updateTour func)
const mongoose = require('mongoose');
const slugify = require('slugify');
//const User = require('./userModel');
//const validator = require('validator');
//The role of the schema is to describe the data,
//set default vaules, validate etc...
//here we can define some validators on the data
//which will be caught by the catchAsync class,
//and will be handled in errorController
//args: schema definition, object for schema options
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      //Validator
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      //These 2 validators are avilabe only on strings
      maxLength: [40, 'A tour name must have less or equal to 40 characters'],
      minLength: [10, 'A tour name must have more or equal to 10 characters'],
      // validate: [validator.isAlpha, 'Tour name must only contain characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      //validator (only for strings)
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    //ratingsAverage & ratingsQuantity are not inserted by the user,
    //they are calculated by the app from the real reviews
    ratingsAverage: {
      type: Number,
      default: 4.5,
      //Validator (for numbers and dates)
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      //Runs every time a val is set to this fiels
      set: (val) => Math.round(val * 10) / 10, // 4.66666, 46.666, 47, 4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //In a validator function 'this' keyword points to the current doc
          //on NEW document creation (but not in 'update' func, in such case it will point to the node object)
          //So, this function works only for posting a new doc
          //console.log(this);
          return val < this.price; //return true if priceDiscount is less than the price
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      //Dont show to user
      select: false,
    },
    startDates: [Date],
    secretTour: {
      //schema type options
      type: Boolean,
      default: false,
    },
    // nested-embedded objects, with schema options
    startLocation: {
        // GeoJSON
        type: {
          type: String,
          default: 'Point',
          enum: ['Point']
        },
      //an array of points. latitude, longitude
      coordinates: [Number],
      address: String,
      description: String,
    },
    //embedded docs in tour doc
    locations: [
      {
        type: {
          type: String,
          address: String,
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    //(Embedded User way
    //guides: Array)

    //childRef - the guides belong to the tour
    guides: [
      {
        //mongodb id
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },

  {
    //Each time that the data is actually ouputted as JSON/object
    // the virtuals(fields which are not stored in the DB) will be part of the output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Sort p rice in ascending order (-1 des) and storing in a set
// So if we specify in URL price[lt]=1000, then only
//ths first 3 docs will get scanned, since the prices are sorted
// tourSchema.index({ price: 1 });

// compund index, sorting fields and storing in a seperate set
// now 'price[lt]=1000&ratingsAverage[gte]=4.7' will run much faster
//because it will go only over fewer docs
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
//2d sphere index
tourSchema.index({ startLocation: '2dsphere' });

//VIRTUAL: virtual properties are not persistent in the the DB
//but calculated when needed!
//We can't use a virtual prperty in query (like: =1, no!)
//Create a virtual property: durationWeeks
//It will not be persisted in the DB, but will be calculated only when we get the data
//It will be created each time we get something from the DB
//this refers to current doc (also an object of the schema)
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Defining a virtual field that will be populated later on getTour
// Virtual populate, that is for a father who doesnt know his children
//but his children know him :)
//In order not to do child ref for reviews, because
//each can have a lot of reviews, we caculate it here
//and dont persist on LS
tourSchema.virtual('reviews', {
  ref: 'Review',
  //the field to other model where the current doc is stored
  foreignField: 'tour',
  //where the id is stored in the current model
  //the _id, is how it's called in this model is called 'tour' in the foreign m
  localField: '_id',
});

//mongoose has its own mw stack, which differs from the app mw

// DOCUMENT MIDDLEWARE: runs before .save() and .create() (not on update)
// Not running on update, findByIdAndUpdate & findByIdAndDelete

//this refers to the document
//Define a slug field before creating a new doc
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  // console.log(this);
  // console.log(this.slug);
  next();
});

// QUERY MIDDLEWARE: executes for all functions starting with find

//this refers to the current query
//this one is executed right before
//the query made by .find()/findById() is executed(in getTour/Tours/updateTour)
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

//populate fills up the referenced field to the docs data from another collection
//without the v and passwordChangedAt fields
tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });
  next();
});

//Runs after the query got executed,
//Has an access to the returned docs
tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took: ${Date.now() - this.start} millisecs`);
  next();
});

// AGGREGATION MIDDLEWARE
//Runs before an aggregation executes
//Making sure that secretTours won't be displayed to the user
// tourSchema.pre('aggregate', function (next) {
//   //Add at the beginning of the pipeline array another stage
//   //Matching tours that are not secret
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   console.log(this.pipeline());
//   console.log('aggregation mw!');
//   next();
// });

//Create a model, which is also a collection
//An instance of a model is called a document.
const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;

//Converting the user ID's that the user inserts into the user objects
//(creating embedded user docs inside the tour for creating a new tour)
//We won't use it, because users are often updated...
// tourSchema.pre('save', async function (next) {
//   //.map() returns an array of promises
//   //console.log(this.guides.map(async (id) => await User.findById(id)));
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidesPromises);
//   //console.log(this.guides)
//   next();
// });