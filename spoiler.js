console.log("\033c");

const request       = require('request');
const cheerio       = require('cheerio');
const readlineSync  = require('readline-sync');

enterInputArguments();


function checkArguments(args) {
    let warningTime = Number(args.slice(-1));
    let movieTitle  = (args.slice(0, (args.length - 1)).join(" "));

    if (args.length < 2) {
        console.log(`Arguments provided: ${args}`);
        
        let message = "Error: You did not provide enough arguments. At least 2 are required.";
        console.log(message);
    } else if (isNaN(warningTime)) {
        console.log(`Arguments provided: ${args}`);
        console.log("Please enter a number as the second argument.");
    } else {
        console.log(`Arguments provided: ${movieTitle}, ${warningTime}`);

        getMovieData(movieTitle, warningTime);
        return;
    }

    enterInputArguments();
}


function enterInputArguments() {
    let message = "\nPlease provide the movie title and the amount of time in seconds for us to wait.";
    message += "\nEx: star wars,5 \n> ";
    const selection = readlineSync.question(message);

    let splitSelection = selection.split(",");

    checkArguments(splitSelection);
}


function sendRequest(options) {

    return new Promise(function (resolve, reject) {

        request(options, (error, response, body) => {

            if (!error) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}


function getMovieResults(title) {
    let options = {
        url: `https://www.google.ca/search?tbm=nws&q=${title}`,
        method: 'GET',
        headers: {}
    };

    sendRequest(options)
        .then((body) => {
            var $ = cheerio.load(body),
                aTags = $(".r a");

            console.log(`\nThe latest google search results for the film "${title}" are: \n`);

            let linksArr = [];
            aTags.each(function (i, link) {
                let linkTitle = $(link).text();
                let replacedLink = ($(link).attr('href')).replace("/url?q=", "");
                let replacedLink2 = replacedLink.substring(0, replacedLink.indexOf('&'));

                console.log(`${i + 1}. ${linkTitle}`);

                linksArr.push({
                    "linkTitle": linkTitle,
                    "link": replacedLink2
                });
            });

            let message         = "\nPlease select from the list to learn more (Enter the number).\n> ";
            let selection       = readlineSync.question(message);
            let selectionNumber = Number(selection) - 1;

            console.log(`\nDirect Link: ${linksArr[selectionNumber]["link"]}:\n`);
            console.log(`${linksArr[selectionNumber]["linkTitle"]}:\n`);

            let options = {
                url: linksArr[selectionNumber]["link"],
                method: 'GET',
                headers: {}
            };

            return sendRequest(options);
        }).then((body) => {
            let $ = cheerio.load(body),
                pTags = $("body p");

            pTags.each(function (i, para) {
                let paraText = $(para).text();

                console.log(paraText);
            });

            let message     = "\nWould you like to search for another movie? (y/n) \n> ";
            let selection   = readlineSync.question(message);

            if (selection.toLowerCase() === 'y') {
                enterInputArguments();
            } else if (selection.toLowerCase() === 'n') {
                console.log("See ya!");
            } else {
                console.log('Please enter either y (yes) or n (no).');
            }
        }).catch(function (err) {
            console.error('catch', err);
        });
}


function getMovieData(title, time) {
    let apiKey = "19361d3f16361090c14e1f550edf9298";

    let options = {
        url: "https://api.themoviedb.org/3/search/movie/",
        method: 'GET',
        qs: {
            "api_key": apiKey,
            "language": "en-US",
            "query": title,
            "page": 1,
            "include_adult": false
        },
        headers: {}
    };
    sendRequest(options)
        .then((body) => {
            let data = JSON.parse(body);

            if (data.results.length == 0) {
                console.log(`We could not locate the movie '${title}'.`);

                enterInputArguments();
                return;
            }

            let id = data.results[0].id

            let options = {
                url: `https://api.themoviedb.org/3/movie/${id}`,
                method: 'GET',
                qs: {
                    "api_key": apiKey,
                    "language": "en-US"
                },
                headers: {}
            };

            return sendRequest(options);
        }).then((body) => {
            let data = JSON.parse(body);

            console.log(`**Spoiler Warning** about to spoil the movie ${title} in ${time} seconds`);

            setTimeout(() => {
                console.log("\nOverview:\n" + data.overview);
                getMovieResults(title);
            }, time * 1000);
        }).catch(function (err) {
            console.error('catch', err);
        });
}