/*
    Dependencies
*/
var connect = require('connect');
var logger = require("morgan"); 
var serve_static = require("serve-static"); 
var http = require('http');
var ejs = require('ejs');
var url = require('url');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var dateformat = require('dateformat');
// Mongo DB Connection
var MongoClient = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
// Connection URL
const db_url = 'mongodb://localhost:27017'
// Database Name
const dbName = 'guessing_game';
// Create new MongoClient
const client = new MongoClient(db_url,{useUnifiedTopology: true});
let db;
let games_col;
var sess = {
    secret: 'Phil is cool... duh',
    resave: false,
    saveUninitialized: false,
    cookie: {}
};

(async function() {
    try {
        await client.connect();
        console.log("Connected correctly to server");
        console.log("paf guessing mongo application connected...");
        db = client.db(dbName);
        games_col = db.collection("games");
        //
        var app = connect()
            .use (logger('dev'))
            .use (session(sess))
            .use (bodyParser.json())
            .use (serve_static(path.join(__dirname, 'public')))
            .use(serve);
        http.createServer(app).listen(3000);
    }
    catch(err) {
        console.log(err.stack);
    }

    async function serve(req, res) {
        console.log(req.url + " has been requested");
        let uri =  url.parse(req.url,true);
        let path = uri.pathname;
        
        if ( path == "/start") {
            
            // We cannot render the response until we are fully initialized - 
            // specifically, the session object on req will be destroyed
            // once we send a response - so we must pass the render code 
            // in as a callback for init to call when it's done initializing
            // the session
            await init(req);
            render(res, "guess_form", {});
        }
        else if ( path == "/guess") {
            //
            var secret_number = req.session.secret_number;
            var id = ObjectID(req.session.game_id);
            var new_game = req.session.new_game;
            let set;
            let time_stamp = req.session.time_stamp;
            if (new_game) {
                set = {$set: {
                    _id: id, 
                    secret_number: secret_number, 
                    time_stamp: time_stamp, 
                    complete: false,
                    guesses: []}
                };
                req.session.new_game = false;
            } 
            else {
                set = {}
            }
            var guess = req.body.guess;
            let filter = {_id:id};
            let success = (guess == secret_number);
            let high = (guess > secret_number);
            let low = (guess < secret_number);
            console.log ( secret_number + ' <> ' + guess);
            res.writeHead(200, { 'Content-Type': 'application/json'});
            if (success) {
                res.end(JSON.stringify({result: 'success'}));
                if (new_game) {
                    set.$set.complete = true;
                }
                else {
                    set.$set = {complete: true};
                }
            }
            else if ( low ) {
                res.end(JSON.stringify({result: 'low'}));
            }
            else if (high) {
                res.end(JSON.stringify({result: 'high'}));
            }
            if (new_game) {
                set.$set.guesses.push(guess);
            }
            else {
                set.$push = {guesses:guess};
            };
            // perform update to server if success
            try {
                let r = await games_col.updateOne(filter, set, {upsert: true});
            }
            catch (err) {
                console.log(err.stack);
            }
        }
        else if (path == "/detail") {
            try {
                console.log("gameid passed to game_detail: " + uri.query.gameid);
                let response = await games_col.find({_id: ObjectID(uri.query.gameid)}).limit(1).toArray();
                let game = await response[0];
                res.end( JSON.stringify(game));
                
                return;
            }
            catch(err) {
                if(err) {
                    console.log(err.stack);
                }
            }

        } 
        else if ( path == "/history") {
            // Display the completed games        
            try {
                let history = await games_col.find({complete: true}).toArray();
                render(res, "guess_history", {history:history});
            } catch (err) {
                console.log(err.stack);
            }
        }
    }
    /**
     * Initialize Guessing game. 
     * Description:
     *  Initialize a game_id, secret_number to be guessed by the user, and the time_stamp
     *  of when the game started.
     * 
     * Attach these fields to the session.
     * 
     *  Attach the secret number to the session as well as the id of the document just created
     * @param {Request} req 
     */
    async function init(req) {
        try {
            var secret_number = Math.floor((Math.random()*10 + 1));
            var now = dateformat();
            let game_id = ObjectID();
            // let game = {_id: game_id, time_stamp:now, secret_number:value, complete: false, guesses: []};
            // let r = await games_col.insertOne({_id: game_id,start_time:now, secret_number:value, complete: false, guesses: []});
            // assert.equal(1, r.insertedCount);
            req.session.new_game = true;
            req.session.secret_number = secret_number;
            req.session.game_id = game_id;
            req.session.time_stamp = now;
            console.log("The secret number is %d", secret_number);
            // console.log("Inserted Document id: " + r.insertedId);
        }
        catch (err) {
            console.log(err.stack);
        }
    }
    
    function render(res, view, model) {
        ejs.renderFile(path.join(__dirname,'templates/' + view + ".ejs"), model,
            function(err, result) {
                if (!err) {
                    res.end(result);
                }
                else {
                    console.log(err.stack);
                    res.end("An error occurred");
                }
            }
        )
    }
})();
