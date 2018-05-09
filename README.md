

# Unit test: Tea Time!

This is a **battery included** [mocha-compatible](http://mochajs.org/) test framework.

For the doc, start reading the [mocha documentation](http://mochajs.org/).



## Specific *Tea Time!* features:

* Many reporters can be used at once, just using multiple `--reporter` options in the CLI

* **NEW!** Promise-returning (or async function) tests and hooks

* **NEW!** Built-in *expect* assertion (but custom assertion lib can be used as well), through the `expect` global function

* **NEW!** (beta) Built-in test coverage, with in-terminal report, example:

    `tea-time -C`
  
  ... or even better using a pager:

    `tea-time -C | less -r`

* Run browser tests directly from the CLI! So you can script browser tests as well! This example will grab all test in the
  `test` directory and build a browser version of them using [Browserify](https://www.npmjs.com/package/browserify),
  create a HTML target file in the OS tmp directory, open it using Firefox, run the test in Firefox while reporting
  anything to Tea Time (using websocket behind the scene).

    `tea-time test/*js --tmp-html --ws --browserify --browser firefox`

  ... or use the shorthand:

    `tea-time test/*js --bb firefox`

* Optional tests:
	
	When an optional test fails, it does not cause a 'fail' but an 'optionalFail'.
	Optional fails don't produce non-zero exit code.
	Common use cases are next iteration preparation, or test cases created just after a bug discovery: we do not want those
	fails to prevent new releases since there is no regression.
	
	Syntaxes:
	- .optional()
	- .opt()
	- .next()
	
    ```js
    it.optional( "Optional test" , function( done ) {
        throw new Error( "Optional fail" ) ;
    } ) ;
    ```

* Better test isolation, mocha (v3.0.2 ATM) would fail to run this test properly:

    ```js
    describe( "Desync" , function() {
        
        it( "should timeout and fail after the timeout" , function( done ) {
            
            this.timeout( 100 ) ;
            
            setTimeout( function() {
                throw new Error( "Delayed fail" ) ;
            } , 200 ) ;
        } ) ;
        
        it( "should pass without being affected by the previous test after-timeout failure" , function( done ) {
            
            setTimeout( function() {
                done() ;
            } , 500 ) ;
        } ) ;
    } ) ;
    ```


## Install

Install it globally: `npm install -g tea-time`.



## Usage

Usage is: tea-time [*test files*] [*option1*] [*option2*] [...]

Available options:
```
  -h , --help             Show this help
  -C , --cover            Perform test coverage (beta feature, node.js only)
  -t , --timeout <time>   Set the default timeout for each test (default: 2000ms)
  -s , --slow <time>      Set the default slow time for each test (default: 75ms)
  -g , --grep <pattern>   Grep: filter in tests/suites by this pattern (can be used multiple times)
  -c , --console          Allow console.log() and friends
  -b , --bail             Bail after the first test failure
  -O , --skip-optional    Skip optional tests
  -R , --reporter <name>  Set/add the reporter (can be used multiple times)
 --clientReporter <name>  Set/add the client reporter (see --browser, can be used multiple times)
       --html <file>      Build one HTML file for all input test files, to run the test in browsers
       --tmp-html         Like --html but create a temporary file in the OS temp folder
       --browserify       In conjunction with --html, call Browserify to build a browser version
                          for each input files
       --ws               Start a websocket server, endpoint to the browser websocket client reporter
  -B , --browser <exe>    Open the html with the <exe> browser, need --html <file>,
                          force --ws and the websocket client reporter
       --bb <exe>         Shorthand for --tmp-html --ws --browserify --browser <exe>
```


## Reporters

* **classic**: *the default reporter*
* **one-line**: *one line status*
* **panel**: *a reporter that does not scroll (except on the final error report, if any)*
* **progress**: *a progress bar reporter*
* **tap**: *Test Anything Protocol*
* **dot**: *output colorful dots*
* **verbose**: *like classic, but more verbose*
* **report**: *use in conjunction with another reporter, only output the final status report*
* **error-report**: *use in conjunction with another reporter, only output the final error report*
* **coverage-summary**: *use in conjunction with another reporter, output partly uncovered files with percent*
* **coverage-report**: *use in conjunction with another reporter, output all uncovered lines of code*
* **notify**: *use in conjunction with another reporter, send a freedesktop.org notification with the final status report*



Browser reporters:

* **classic**: *the default reporter*
* **console**: *report everything in the browser console, using console.log()*
* **websocket**: *connect to a local Tea Time instance, and send anything to it*

