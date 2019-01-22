/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

const {
  BaseKonnector,
  requestFactory,
  signin,
  scrape,
  saveFiles,
  log
} = __webpack_require__(!(function webpackMissingModule() { var e = new Error("Cannot find module 'cozy-konnector-libs'"); e.code = 'MODULE_NOT_FOUND'; throw e; }()))

const request = requestFactory({
  // the debug mode shows all the details about http request and responses. Very useful for
  // debugging but very verbose. That is why it is commented out by default
  // debug: true,
  // activates [cheerio](https://cheerio.js.org/) parsing on each page
  cheerio: true,
  // If cheerio is activated do not forget to deactivate json parsing (which is activated by
  // default in cozy-konnector-libs
  json: false,
  // this allows request-promise to keep cookies between requests
  jar: true
})

var cache=[];

const baseUrl = 'https://i-citya.com/extranet'
var $;
module.exports = new BaseKonnector(start)

// The start function is run by the BaseKonnector instance only when it got all the account
// information (fields). When you run this connector yourself in "standalone" mode or "dev" mode,
// the account information come from ./konnector-dev-config.json file
async function start(fields) {
  log('info', 'Authenticating ...')
  await authenticate(fields.login, fields.password)
  log('info', 'Successfully logged in')
  // The BaseKonnector instance expects a Promise as return of the function
  log('info', 'Fetching the list of documents')
  $ = await request(`${baseUrl}/documents.html`)
  // cheerio (https://cheerio.js.org/) uses the same api as jQuery (http://jquery.com/)
  log('info', 'Parsing list of documents')
  const documents = await parseDocuments($)
  
  log('info','Save data to Cozy')
  await saveFiles(documents, fields, {
    timeout: Date.now() + 300*1000
  })

}

// this shows authentication using the [signin function](https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#module_signin)
// even if this in another domain here, but it works as an example
function authenticate(username, password) {
  return signin({
    url: `https://www.citya.com/i-citya/coproprietaire`,
    formSelector: 'form',
    formData: { login:username, mdp:password, vous_etes:'/i-citya/coproprietaire' },
    // the validate function will check if the login request was a success. Every website has
    // different ways respond: http status code, error message in html ($), http redirection
    // (fullResponse.request.uri.href)...
    validate: (statusCode, $, fullResponse) => {

      // The login in toscrape.com always works excepted when no password is set
      if ($(`a[href='deconnexion-citya.html']`).length >= 1) {
        return true
      } else {
        // cozy-konnector-libs has its own logging function which format these logs with colors in
        // standalone and dev mode and as JSON in production mode
        log('error', $('.error').text())
        return false
      }
    }
  })
}

// The goal of this function is to parse a html page wrapped by a cheerio instance
// and return an array of js objects which will be saved to the cozy by saveBills (https://github.com/konnectors/libs/blob/master/packages/cozy-konnector-libs/docs/api.md#savebills)
async function parseDocuments($) {
  // Il faut recuperer les liens
  tabLiens = $('.text-box>a');
  var docs = [];
  for(i=0;i<tabLiens.length;i++)
  {
   // Fait la requete
   $ = await request(baseUrl + '/' + tabLiens[i].attribs.href);

    // Recupere les documents de la page
    documents = parseDocuments_page($);
    docs.push(...documents)
    // pour l'instant on ne fait pas les documents du syndic
    // voir la fonction parseDocuments_syndic pour 'comment il faudrait faire'
    break;
  }

  return docs;
}

function parseDocuments_page($) {

  tabLiens = $('.ged-blockquote>a');

  log('info','Nombre de liens : ' + tabLiens.length);
  var docs = [];
  for (var i=0;i< tabLiens.length;i++)
  {
    oLien =  tabLiens[i];

   sTitre = oLien.children[1].children[2].data;
   sTitre = sTitre.trim();

   sFileURL = baseUrl + '/' + oLien.attribs.href;
   sDate = dateFromTitle(sTitre);

   sFileName = getParamFromQueryString(sFileURL,'file');

   log('info','sTitre : ' + sTitre)
   log('info','sFileURL : ' + sFileURL)
   log('info','sDate : ' + sDate)
   log('info','sFileName : ' + sFileName)

   docs.push({title:sTitre, fileurl:sFileURL, date:sDate, filename:sFileName });

  }

  return docs

}

function getParamFromQueryString(sURL, sParam)
{
 tabParams = sURL.split('?');
 tabParams = tabParams[1].split('&');
 for (var i=0;i< tabParams.length;i++)
 {
   tabParam =  tabParams[i].split('=');
   if (tabParam[0] == sParam)
     return tabParam[1];
 }
 return ''

}

// convert a price string to a float
function dateFromTitle(sTitre) {

  // titre :  Appels de fonds du 01 01 2019 
  var regex = /([0-9]{2,4})/g;
  var found = sTitre.match(regex);

  return new Date(found[2] + '-' + found[1] + '-' + found[0]);

}

function parseDocuments_syndic($)
{

// Selecteur des divs dossier : "div[id^='dossier-']", 
// Chargement du contenu (il faut que ca soit recursif (ca peut renvoyer des sous dossier)
// ca renvoie soit des divs avec  le meme fonctionnement, soit des liens de la forme :
/*
 <a href="download.php?file=0028_CONVOC_AG_2018_11_26.pdf&chemin=Zdna0ceblpSUZ5OaYph1qMN8g5OTenplusHiYSmeImrtIaVp6iSk2JlncN6sLCJiHfApYCPlmRoaJhkZsJpa5DVnJw&crypt=on" class="nodecoration">
                  <div class="ged-blockquoteOFF">
                  	                 		<img src="img/ged/pdf.png" class="ged-icon" /> 0028 CONVOC AG 2018 11 26.pdf                  	                  </div>
                  </a> 
				  				  
                  <a href="download.php?file=0028_CONVOC_AGC_2017_09_25.pdf&chemin=Zdna0ceblpSUZ5OaYph1qMN8g5OTenplusHiYSmeImrtIaVp6iSk2JlncN6sLCJiHfApYBzw2ZnYXCSZZyWZ5eTqJrM&crypt=on" class="nodecoration">
                  <div class="ged-blockquoteOFF">
                  	                 		<img src="img/ged/pdf.png" class="ged-icon" /> 0028 CONVOC AGC 2017 09 25.pdf                  	                  </div>
                  </a> 
				  				  
                  <a href="download.php?file=0028_CONVOC_AGC_2017_07_20.pdf&chemin=Zdna0ceblpSUZ5OaYph1qMN8g5OTenplusHiYSmeImrtIaVp6iSk2JlncN6sLCJiHfApYBzw2ZnYXCSZZqWZ5KTqJrM&crypt=on" class="nodecoration">
                  <div class="ged-blockquoteOFF">
                  	                 		<img src="img/ged/pdf.png" class="ged-icon" /> 0028 CONVOC AGC 2017 07 20.pdf                  	                  </div>
                  </a> 
				  



/*		var tab_id = $(this).attr("id").split("-");
		var id_dossier = tab_id[1];
		var nom_dossier = tab_id[2];
		var iiii = tab_id[3];
		var cccc = tab_id[4];
		var mmmm = tab_id[5];
		var llll = tab_id[6];
		var xxxx = tab_id[7];
		var path = tab_id[8];



			if(nom_dossier) {
				$.ajax({
					type: "POST",
					url: "php/sous_dossier.php",
					data: {
						nom_dossier: nom_dossier,
						iiii: iiii,
						cccc: cccc,
						mmmm: mmmm,
						llll: llll,
						xxxx: xxxx,
						path: path
					},
					success: function (retour) {
						$("#sousdossier-" + id_dossier).html(retour);
					}
				});
			}


*/
}


/***/ })
/******/ ]);