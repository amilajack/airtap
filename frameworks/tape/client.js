var parser = require('tap-parser');
var inspect = require('util').inspect;

var ZuulReporter = require('../zuul');

if (typeof global.console === 'undefined') {
    global.console = {};
}

var reporter = ZuulReporter(run);
var previous_test = undefined;
var assertions = 0;
var done = false;
var got_test_num = false;
var got_pass_num = false;

var parse_stream = parser(function(results) {
    reporter.done();
});

var originalLog = console.log;
console.log = function () {
    var index = 1;
    var args = arguments;
    var msg = args[0];
var originalLog = global.console.log;
global.console.log = function () {

    if (!msg) {
        return;
    }

    if (typeof msg === 'string') {
        msg = msg.replace(/(^|[^%])%[sd]/g, function (_, s) {
            return s + args[index++];
        });
    }
    else msg = inspect(msg);

    for (var i = index; i < args.length; i++) {
        msg += ' ' + inspect(args[i]);
    }

    parse_stream.write(msg + '\n');

    if (/^# tests( )*\d/.test(msg)) {
      got_test_num = true;
    }

    if (/^# pass( )*\d/.test(msg)) {
      originalLog.call(this, 'got', msg);
      got_pass_num = true;
    }

    if ((/^# fail\s*\d+$/.test(msg) || /^# ok/.test(msg)) && got_test_num && got_pass_num) {
        parse_stream.end();
    }

    if (typeof originalLog === 'function') {
        return originalLog.apply(this, arguments);
    }
    else if (originalLog) {
        return originalLog(arguments[0]);
    }
};

parse_stream.on('comment', function(comment) {
    if (done) {
        return;
    }

    if (previous_test) {
        reporter.test_end({
            passed: assertions === 0,
            name: previous_test.name
        });
    }

    previous_test = {
        name: comment
    };

    assertions = 0;

    reporter.test({
        name: comment
    });
});

parse_stream.on('assert', function(assert) {
    if (!assert.ok) {
        assertions++;
    }

    reporter.assertion({
        result: assert.ok,
        expected: undefined,
        actual: undefined,
        message: assert.name || 'unnamed assert',
        error: undefined,
        stack: undefined
    });
});

parse_stream.on('plan', function(plan) {
    done = true;

    if (previous_test) {
        reporter.test_end({
            passed: assertions === 0,
            name: previous_test.name
        });
    }
});

function run() {
  // tape tests already start by default
  // I don't like this stuff, very annoying to interface with
}
