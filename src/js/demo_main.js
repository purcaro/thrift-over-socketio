define(
    [// dependencies for the demo:
    // thrift-related
    "thrift", 
    "socketio_transport",
    // jquery for the ui stuff
    "lib/jquery-1.6.2"], function(thrift, socketio_transport) {
        window.Thrift = thrift;
        require.ready(function() {
            var genjs_files = ["./shared_types", "./SharedService", "./tutorial_types", "./Calculator"],
                genjs_modules = {
                    'thrift': thrift
                },
                socket = new io.Socket(location.hostname),
                calc = function () {
                    var transport = new Thrift.Transport("socket");
                    var protocol  = new Thrift.Protocol(transport);
                    var client    = new CalculatorClient(protocol);

                    var work = new Work()
                    work.num1 = $("#num1").val();
                    work.num2 = $("#num2").val();
                    work.op = $("#op").val();

                    try {
                        result = client.calculate(1, work);
                        $('#result').val(result);
                        $('#result').css('color', 'black');
                    } catch(ouch){
                        $('#result').val(ouch.why);
                        $('#result').css('color', 'red');
                    }
                },
                auto_calc = function () {
                    if ($('#autoupdate:checked').val() !== undefined) {
                        calc();
                    }
                },
                init = function() {
                    $("#op").children().remove();
                    // add operations to it's dropdown menu
                    $.each(Operation, function(key, value) {
                        $('#op').append($("<option></option>").attr("value",value).text(key)); 
                    });
                    $('table.calculator').attr('width', 500);
                    $('#num1').keyup(auto_calc);
                    $('#op').keyup(auto_calc);
                    $('#num2').keyup(auto_calc);
                    $('#calculate').click(calc);
                },
                // ---- library functions below ----
                merge = function (src, dest) {
                    var i;
                    for (i in src) if (src.hasOwnProperty(i)) dest[i] = src[i];
                    return dest;
                },
                get_module_name = function(filename) {
                    // based on: http://phpjs.org/functions/basename:360
                    return filename.replace(/^.*[\/\\]/g, '').split('\.',1);
                },
                fake_require,
                real_require,
                load_genjs_file = function(jsfile, cb) {
                    // hide the "real" require object!
                    var real_require = require,
                        module_name = get_module_name(jsfile),
                        result = {},
                        module = {},
                        exports = {};
                    result[module_name] = {};
                    // sometimes stuff is added to module directly,
                    // other times it is iadded to module.exports.
                    window.exports = exports;
                    window.module = module;
                    real_require([jsfile], function() {
                        if (typeof(cb) === 'function') {
                            // we need define so require.js finds the module.
                            merge(exports, result[module_name]);
                            if (module.hasOwnProperty('exports')) {
                                merge(module.exports, result[module_name]);
                            }
                            cb(result);
                        }
                    });
                },
                globalize_modules = function(module_store)  {
                    var i,j;
                    for (i in module_store) {
                        if (module_store.hasOwnProperty(i)) {
                            for (j in module_store[i]) {
                                if (module_store[i].hasOwnProperty(j)) {
                                    window[j] = module_store[i][j];
                                }
                            }
                        }
                    }
                },
                load_all_genjs_files; 
        
            fake_require = function() {
                if (arguments.length === 1 && typeof(arguments[0]) === 'string') return genjs_modules[get_module_name(arguments[0])];
                return real_require.apply(this, arguments);
            };
            merge(real_require, fake_require);
            real_require = window.require;
            window.require = fake_require;

            load_all_genjs_files = function(file_list, module_store) {
                var current_file = file_list.shift(), module;
                // If we have reached the end of the list, end the recursion.
                if (current_file === undefined) {
                    globalize_modules(module_store);
                    return init();
                }
                load_genjs_file(current_file, function(module) {
                    merge(module, module_store);
                    load_all_genjs_files(file_list, module_store);
                }); 
            };
            load_all_genjs_files(genjs_files, genjs_modules);
        });
});
/*
   function init() {
   socket = new io.Socket(location.hostname);
   socket.on('message', function(data){
   console.log(data);
   });
   socket.on('connect', function(){
   console.log("Imma connectad!");
   console.log(socket);
   socket.send({msg: "Erlang rulez!"});

   });
   socket.connect();
   }*/

