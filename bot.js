
var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var pprint = require('pretty-print');
var grpc = require('grpc');
var protoLoader = require('@grpc/proto-loader');

// Pretty print options
var ppoptions = {
    leftPadding: 2,
    rightPadding: 3
};

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';

// Initialize Discord Bot
var voidConfig = {}; // Maps server id to relevant items in server
logger.info(auth.token);
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    initServers();
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            // Just add any case commands if you want to..
         }
     }
});

function getServerConfig(server) {
    process.stdout.write("getServerConfig: " + server.id + "\n");

    // Find void channel
    let res = Object.values(server.channels).filter(m => m.name === "the-void");
    process.stdout.write(JSON.stringify(res));
    if( res.length !== 1 ) {
	throw Error("Unable to find the-void channel");
    } // if

    // Find void roles
    const roles = server.roles;
    pprint(roles,ppoptions);
    let forVoidRole = getRole(server, "for-void");
    let ofVoidRole = getRole(server, "of-void");
    process.stdout.write("FOR VOID:\n" + JSON.stringify(forVoidRole) + "\n\n\n");
    process.stdout.write("OF VOID:\n" + JSON.stringify(ofVoidRole) + "\n\n\n");

    return {
	voidChannelId: res[0].id,
	forVoidRoleId: forVoidRole.id,
	ofVoidRoleId: ofVoidRole.id,
    };
};

function initServers() {
    for (const [ key, value ] of Object.entries(bot.servers)) {
	voidConfig[key] = getServerConfig(value);
    }
    process.stdout.write("\n\n\nVOID CONFIG\n\n");
    pprint( voidConfig, ppoptions );
    process.stdout.write("\n\n\nROTATE\n\n");
    // TODO: remove
    for (const [ key, value ] of Object.entries(bot.servers)) {
	rotateVoid(key);
    }
}

function getRole(server, roleName) {
    const match = Object.values(server.roles).filter(m => m.name === roleName);
    if( match.length !== 1 ) {
	throw Error("No matching role for " + roleName);
    }// if
    return match[0];
};

function rotateVoid(serverID) {
    logger.info("rotateVoid");

    const conf = voidConfig[serverID];
    const server = bot.servers[serverID];
    var users = Object.values(server.members)
	.filter(m => m.roles.includes(conf.forVoidRoleId));

    var userNames = users.map(m => m.username + "#" + m.discriminator);
    logger.info("for-void users: " + JSON.stringify(userNames));

    let toVoid = users[Math.floor(Math.random() * users.length)];
    logger.info("To void: " + toVoid.username + "#"
		+ toVoid.discriminator
		+ " (" + toVoid.id + ")" );

    // Remove users currently in void
    var userIDs = users.map(m => m.id);
    for( let id of userIDs ) {
	bot.removeFromRole({
	    serverID: serverID,
	    userID: id,
	    roleID: conf.ofVoidRoleId
	}, function(e, r) {
	    let uid = id;
	    if( e || r ) {
		logger.error("Error removing from role: " + JSON.stringify([uid, e,r]));
	    }
	});
    }

    bot.addToRole({
	serverID: serverID,
	userID: toVoid.id,
	roleID: conf.ofVoidRoleId
    }, function(e, r) {
	if( e || r ) {
	    logger.error("Error adding to role: " + JSON.stringify([toVoid.id, e,r]));
	}
    });
};


// RPC interface

var PROTO_PATH = __dirname + '/helloworld.proto';
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH, {
	keepCase: true,
	longs: String,
	enums: String,
	defaults: true,
	oneofs: true
    });

var hello_proto = grpc.loadPackageDefinition(packageDefinition).helloworld;

/**
 * Implements the SayHello RPC method.
 */
function sayHello(call, callback) {
    callback(null, {message: call.request.name});

    if( call.request.name === "ROTATE" ) {
	for (const [ key, serverConf ] of Object.entries(voidConfig)) {
	    rotateVoid(key);
	} // for
	return;
    } // if

    logger.info("Message: " + call.request.name);
    for (const [ key, serverConf ] of Object.entries(voidConfig)) {
	bot.sendMessage({
	    to: serverConf.voidChannelId,
	    message: call.request.name
	});
    } // for
}

/**
 * Starts an RPC server that receives requests for the Greeter service at the
 * sample server port
 */
function main() {
    var server = new grpc.Server();
    server.addService(hello_proto.Greeter.service, {sayHello: sayHello});
    server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());
    server.start();
}

main();
