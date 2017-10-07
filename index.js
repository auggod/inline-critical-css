var StringDecoder = require('string_decoder').StringDecoder
var extractClass = require('extract-html-class')
var extractId = require('extract-html-id')
var extractTag = require('extract-html-tag')
var eos = require('end-of-stream')
var through = require('through2')
var hs = require('hyperstream')
var assert = require('assert')
var CleanCSS = require('clean-css')

var filter = require('./lib/filter')

module.exports = inline

function inline (css) {
  if (Buffer.isBuffer(css)) css = String(css)

  assert.equal(typeof css, 'string', 'inline-critical-css: expected css to be type string')

  var decoder = new StringDecoder('utf8')
  var src = ''

  return through(write, flush)

  function write (chunk, _, cb) {
    src += decoder.write(chunk)
    cb()
  }

  function flush (cb) {
    src += decoder.end()

    var self = this
    var valid = extractClass(src).map(function (cls) {
      return '.' + cls
    }).concat(extractId(src).map(function (id) {
      return '#' + id
    })).concat(extractTag(src))

    var critical = filter(css, valid)

    var cleanedCritical = new CleanCSS({
      level: {
        2: {
          all: false, // sets all values to `false`
          removeDuplicateRules: true // turns on removing duplicate rules
        }
      }
    }).minify(critical).styles

    var style = ''
    if (cleanedCritical) {
      style = '<style>' + cleanedCritical + '</style>'
    }

    var source = hs({
      head: { _appendHtml: style }
    })
    source.on('data', function (data) {
      self.push(data)
    })
    eos(source, function (err) {
      if (err) return cb(err)
      cb()
    })
    source.end(src)
  }
}
