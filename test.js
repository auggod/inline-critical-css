var concat = require('concat-stream')
var pump = require('pump')
var tape = require('tape')

var inline = require('./')

tape('inlines critical css', function (assert) {
  assert.plan(2)
  var css = `
    .red { color: red }
  `

  var html = `
    <html>
      <head></head>
      <body class="red">Hello world</body>
    </html>
  `

  var expected = `
    <html>
      <head><style>.red{color:red;}</style></head>
      <body class="red">Hello world</body>
    </html>
  `

  var source = inline(css)
  var sink = concat({ encoding: 'string' }, function (str) {
    assert.equal(str, expected, 'was inlined')
  })

  pump(source, sink, function (err) {
    assert.ifError(err, 'no error pumping')
  })

  source.end(html)
})