if ((typeof this.define != 'function')  ||  (! this.define.amd))
    this.define = function () {
        return  arguments[arguments.length - 1]();
    };


define('EasyWebApp',  ['iQuery+'],  function () {

    var WebApp;



});