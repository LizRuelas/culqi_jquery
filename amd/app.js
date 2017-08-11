requirejs.config({
    //By default load any module IDs from js/lib
    baseUrl: 'amd',
    //except, if the module ID starts with "app",
    //load it from the js/app directory. paths
    //config is relative to the baseUrl, and
    //never includes a ".js" extension since
    //the paths config could be for a directory.
    paths: {
        app: 'app'
    },
    // shim : {
    //     //"bootstrap" : { "deps" :['jquery'] },
    //     "app": {"deps": ['jquery']}
    // }
});

requirejs(['lib/jquery' , 'app/register'], function($){


});


