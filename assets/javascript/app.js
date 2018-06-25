$(document).ready(function () {
    // Initialize Firebase
    var config = {
        apiKey: "AIzaSyB1FR-IlKZwEkqP6-3DmiWx8WCTjMuS6OA",
        authDomain: "rock-paper-scissors-2145e.firebaseapp.com",
        databaseURL: "https://rock-paper-scissors-2145e.firebaseio.com",
        projectId: "rock-paper-scissors-2145e",
        storageBucket: "rock-paper-scissors-2145e.appspot.com",
        messagingSenderId: "652684736296"
    };

    var app = firebase.initializeApp(config);

    var database = firebase.database();
    var connections = database.ref('connections');
    var con;
    var player = {
        number: '0',
        name: '',
        wins: 0,
        losses: 0,
        turns: 0,
        choice: ''
    }
    var opponent = {
        number: '0',
        name: '',
        wins: 0,
        losses: 0,
        turns: 0,
        choice: ''
    }
    
    //
    connections.once('value', function (snapshot) {
        if (Object.keys(snapshot.val()).indexOf('1') === -1) {
            player.number = '1';
            opponent.number = '2';
        } else if (Object.keys(snapshot.val()).indexOf('2') === -1) {
            player.number = '2';
            opponent.number = '1';
        }
        // limited to two players
        if (player.number !== '0') {
            con = connections.child(player.number);
            con.set(player);

            //remove this player when they exit the screen
            con.onDisconnect().remove();
        } else {
            //TODO
            // .show() hidden popup saying two players are already playing, please come back later
            app.delete(); // disconnect from firebase
        }
    });

    // when a value in the database changes...
    connections.on('value', function (snapshot) {
        //if user is connected
        if (con) {
            // and opponent is connected
            if (Object.keys(snapshot.val()).indexOf(opponent.number) !== -1) {
                opponent = snapshot.val()[opponent.number];
                player = snapshot.val()[player.number];

                if (opponent.name.length > 0) {
                    DOMFunctions.showOpponentInfo();

                    if (player.name.length > 0) {
                        var choice1 = snapshot.val()['1'].choice;
                        var choice2 = snapshot.val()['2'].choice;
                        var turns1 = snapshot.val()['1'].turns;

                        if (choice1.length > 0 && choice2.length > 0) {
                            getWinner(choice1, choice2);
                        } else if (choice1.length === 0 && turns1 === 0) {
                            DOMFunctions.showMoveOptions('1');
                        } else if (choice1.length > 0 && choice2.length === 0) {
                            DOMFunctions.showMoveOptions('2');
                        }
                    }
                }
            } else if (opponent.name.length > 0 && Object.keys(snapshot.val()).indexOf(opponent.number) === -1) {
                $('.turn').text('Waiting for new opponent...');
                $('.waiting-' + opponent.number).show();
                $('.name-' + opponent.number).empty();
                $('.win-loss-' + opponent.number).empty();
            }
        }
    });

    $('#loginButton').on('click', function () {
        player.name = $("#textBox").val();
        if (player.name.length > 0) {
            database.ref().update({
                name: player.name
            });
            DOMFunctions.showSelfJoin();
        }
        return false;
    });

    // Functions for changing HTML elements.
    var DOMFunctions = {
        showSelfJoin: function () {
            username.val('');
            //$('.user-form').hide();
            $('.waiting-' + player.number).hide();
            $('.name-' + player.number).text(player.name);
            $('.win-loss-' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
            $('.hello').text('Hello ' + player.name + '! You are player ' + player.number + '.').show();
            $('.turn').show();
            $('.chat-row').show();
            $('.moves-' + opponent.number).remove();
            //this.updateScroll();
        },
        showOpponentInfo: function () {
            $('.waiting-' + opponent.number).hide();
            $('.name-' + opponent.number).text(opponent.name);
            $('.win-loss-' + opponent.number).text('Wins: ' + opponent.wins + ' | Losses: ' + opponent.losses);
        },
        updatePlayerStats: function () {
            $('.win-loss-' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
        },
        // updateScroll: function () {
        //     messages[0].scrollTop = messages[0].scrollHeight;
        // },
        showMoveOptions: function (currentPlayer) {
            if (currentPlayer === player.number) {
                $('.moves-' + currentPlayer).css('display', 'flex');
            }
            $('.turn').text('Player ' + currentPlayer + '\'s turn.');
        },
        /* showChats: function (snap) {
             var chatMessage = snap.val();
             // Only show messages sent in the last half hour. A simple workaround for not having a ton of chat history.
             if (Date.now() - chatMessage.timestamp < 1800000) {
                 var messageDiv = $('<div class="message">');
                 messageDiv.html('<span class="sender">' + chatMessage.sender + '</span>: ' + chatMessage.message);
                 messages.append(messageDiv);
             }
             DOMFunctions.updateScroll();
         },*/
        showGameResult: function (message) {
            this.updatePlayerStats();
            $('.choice-' + opponent.number).text(opponent.choiceText).show();
            $('.turn').hide();
            $('.winner').text(message);
            $('.moves').hide();
            setTimeout(function () {
                $('.winner').empty();
                $('.turn').show();
                $('.choice').empty().hide();
                DOMFunctions.showMoveOptions('1');
            }, 3000)
        }
    };
    // On-click function for selecting a move.
    $('.move').on('click', function () {
        var choice = $(this).data('choice');
        var move = $(this).data('text');
        con.update({
            choice: choice,
            choiceText: move
        });

        $('.moves-' + player.number).hide();
        $('.choice-' + player.number).text(move).show();
    });

    var getWinner = function (move1, move2) {
        if (move1 === move2) {
            recordWin();
        }
        if (move1 === 'r' && move2 === 's') {
            recordWin('1', '2');
        }
        if (move1 === 'r' && move2 === 'p') {
            recordWin('2', '1');
        }
        if (move1 === 'p' && move2 === 'r') {
            recordWin('1', '2');
        }
        if (move1 === 'p' && move2 === 's') {
            recordWin('2', '1');
        }
        if (move1 === 's' && move2 === 'p') {
            recordWin('1', '2');
        }
        if (move1 === 's' && move2 === 'r') {
            recordWin('2', '1');
        }
    };
    var recordWin = function (winner, loser) {
        player.turns++;
        connections.child(player.number).update({
            choice: '',
            turns: player.turns
        });
        // If there was a winner,
        if (winner) {
            // Then update your own win/loss count.
            if (winner === player.number) {
                player.wins++;
                connections.child(winner).update({
                    wins: player.wins
                });
            } else {
                player.losses++;
                connections.child(loser).update({
                    losses: player.losses
                });
            }
            // Then show the win.
            DOMFunctions.showGameResult('Player ' + winner + ' wins!');
        } else {
            // Else, show the draw.
            DOMFunctions.showGameResult('Draw.');
        }
    }



}); //document ready