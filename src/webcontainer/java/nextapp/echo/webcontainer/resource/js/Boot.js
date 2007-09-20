/**
 * @fileoverview
 * 
 * Requires Core, WebCore, Application, Render, Serial, Client, RemoteClient.
 */

/**
 * Boot namespace.  Do not instantiate.
 */
EchoBoot = function() { };

/**
 * Array of methods which should be invoked at boot.
 */
EchoBoot._initMethods = new Array();

/**
 * Adds a method to be invoked at boot.
 */
EchoBoot.addInitMethod = function(initMethod) {
    EchoBoot._initMethods.push(initMethod);
};

/**
 * Boots a remote client.
 * 
 * @param serverBaseUrl the servlet URL
 */
EchoBoot.boot = function(serverBaseUrl, debug) {
    EchoWebCore.init();
    
    if (window.EchoDebugConsole) {
        EchoDebugConsole.install();
    }

    var client = new EchoRemoteClient(serverBaseUrl);
    for (var i = 0; i < EchoBoot._initMethods.length; ++i) {
        EchoBoot._initMethods[i](client);
    }
    client.sync();
};
