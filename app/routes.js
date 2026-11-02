const { ObjectId } = require('mongodb');
module.exports = function(app, passport, db) {

// normal routes ===============================================================

    // home page - public landing page
    app.get('/', function(req, res) {
        res.render('index.ejs');
    });

    // PROFILE SECTION - Palette Portal Dashboard =========================
    app.get('/profile', isLoggedIn, function(req, res) {
      //fetch folors created by logged in user
        db.collection('colors').find({user: req.user._id}).toArray((err, result) => {
          if (err) { 
            console.error('Error loading colors:', err);
            return res.status(500).send('Could not load colors');
          }
            
          res.render('profile.ejs', {
            user : req.user,
            colors : result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout(() => {
          console.log('User has logged out!')
        });
        res.redirect('/');
    });

// colors routes ===============================================================

//READ - display saved colors for logged in user
    app.get('/colors', isLoggedIn, function(req, res) {
      db.collection('colors').find({user: req.user._id}).toArray((err, result) => {
        if (err) {
          console.error('Error loading colors:', err);
          return res.status(500).send('Could not load colors');
        }

        res.render('profile.ejs', {
          user : req.user,
          colors : result
        });
      });
    });
    
    //CREATE - add a color for logged in user
    
app.post('/colors', isLoggedIn, function(req, res) {

    // Get the selected HEX color
    const hex = req.body.hex;

    // Validate the HEX color format
    if (
        typeof hex !== 'string' ||
        /^#[0-9a-fA-F]{6}$/.test(hex) === false
    ) {
        return res.status(400).send('Invalid HEX color');
    }

    // Save the color + logged-in user in the database
    db.collection('colors').insertOne({
        hex: hex.toLowerCase(),
        user: req.user._id
    }, function(err, result) {

        if (err) {
            console.error('Error saving color:', err);
            return res.status(500).send('Could not save color');
        }

        // JavaScript requests receive JSON response
        if (req.is('application/json')) {
            return res.status(201).json({
                message: 'Color saved successfully',
                id: result.insertedId,
                hex: hex.toLowerCase()
            });
        }

        // Regular form submissions return to the profile
        res.redirect('/profile');
    });
});

    //DELETE - remove a color using the ObjectId
    app.delete('/colors', isLoggedIn, function(req, res) {

    const id = req.body.id;

    // Validate the MongoDB document ID
    if (typeof id !== 'string' || ObjectId.isValid(id) === false) {
        return res.status(400).send('Invalid color ID');
    }

    // Delete only if this color belongs to the current user
    db.collection('colors').deleteOne({
        _id: new ObjectId(id),
        user: req.user._id
    }, function(err, result) {

        if (err) {
            console.error('Error deleting color:', err);
            return res.status(500).send('Could not delete color');
        }

        // No matching document was found for this user
        if (result.deletedCount === 0) {
            return res.status(404).send('Color not found');
        }

        res.status(200).send('Color deleted successfully');
    });
});

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/profile', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

//     // local -----------------------------------
//     app.get('/unlink/local', isLoggedIn, function(req, res) {
//         var user            = req.user;
//         user.local.email    = undefined;
//         user.local.password = undefined;
//         user.save(function(err) {
//             res.redirect('/profile');
//         });
//     });

// };

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
}