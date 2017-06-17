var mongoose = require('mongoose');


var articleSchema = new Schema({
    title: {
        type: String,
        required: true,

    },

    link: {
        type: String,
        required: true
    },

    saved: {
        type: Boolean,
        default: false
    },
    comments: {
        type: Schema.Types.ObjectId,
        ref: 'Comment'
    }
});

var Article =  mongoose.model('Article', articleSchema);

module.exports = Article;