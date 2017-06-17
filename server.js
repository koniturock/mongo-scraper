//requiring dependencies
var express 		= require('express');
var exphbs 			= require('express-handlebars');
var bodyParser 	= require('body-parser');
var mongoose 		= require('mongoose');
var request 		= require('request');
var cheerio 		= require('cheerio');


var Article 		= require('./models/Article.js');
var Comment 		= require('./models/Comment.js');


var app = express();

app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(express.static('public'));



var db = mongoose.connection;
db.on('error', function (err) {
	console.log('Mongoose Error: ', err);
});


app.engine('handlebars', exphbs({
	defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');


app.get('/', function (req, res) {
	res.redirect('/scraping');
});


app.get('/scraping', (req, res) => {
	var url = 'https://www.cinemablend.com/news.php/';
	var linkUrl = 'https://www.cinemablend.com';
	request.get(url, (err, request, body) => {
		var $ = cheerio.load(body);


		$('.story_item a').each((index, element) => {
			var result = {};

			result.title = $(element)[0].attribs.title;
			result.link = linkUrl + $(element)[0].attribs.href;
			console.log(result.link);


			var article = new Article(result);

			article.save((err, doc) => {

				if (err) {
					console.log('Already scraped');
				} else {
					console.log('New article scraped');
				}
			});
		});
	});

	res.redirect('/articles');
});


app.get('/articles', (req, res) => {
	Article.find({}, (err, doc) => {
		
		if (err) {
			console.log(err);
		}

		else {
			res.render('articles', {
				
				articles: doc
			});
		}
	});
});


app.get('/articles/:id', (req, res) => {
	
	Article.findOne({'_id': req.params.id})
		
		.populate('comments')
		
		.exec((err, doc) => {
			
			if (err) {
				console.log(err);
			}
			
			else {
				res.render('comments', {
					
					article: doc
				});
			}
	});
});


app.post('/articles/:id', (req, res) => {
	
	var newComment = new Comment(req.body);

	
	newComment.save((err, doc) => {
		
		if (err) {
			console.log(err);
			
		} else {
			var articleId = req.params.id;
			Article.findOneAndUpdate({'_id': articleId}, {$push: {'comments': doc._id}})
				.exec((err, doc) => {
					if (err) {
						console.log(err);
					} else {
						
						res.redirect('/articles/' + articleId);
					}
				});
		}
	});
});


app.post('/articles/:aId/delete/:cId', (req, res) => {
	var articleId = req.params.aId;
	var commentId = req.params.cId;
	
	Article.update({'_id': articleId}, {$pull: {'comments': commentId}}, {'multi': false}, (err, res) => {
		
		if (err) {
			console.log(err);
			
		} else {
			Comment.remove({'_id': commentId}, (err, res) => {
				if(err) {
					console.log(err);
				} else {
					console.log('Comment deleted');
				}
			});
		}
	});

	res.redirect('/articles/' + articleId);
});


app.get('/saved', (req, res) => {
	
	Article.find({ 'saved' : true }, (err, doc) => {
		if (err) {
			console.log(err);
		}  else {
			
			res.render('articles-saved', {
				articles: doc
			});
		}
	})
});


app.post('/saved/:id', (req, res) => {
	Article.update({ '_id' : req.params.id }, { $set : { 'saved' : true }}, (err, res) => (err) ? console.log(err) : console.log(res)); 
	res.redirect('/articles');
})


app.post('/unsaved/:id', (req, res) => {
	
	Article.update( { '_id' : req.params.id }, { $set : { 'saved' : false }}, (err, res) => (err) ? console.log(err) : console.log(res));
	
	res.redirect('/saved');
});


app.listen(process.env.PORT || 3000, () => {
	console.log('App running on port 3000');
});