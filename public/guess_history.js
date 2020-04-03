$(document).ready(function() {
    $('tr').on("click", async function () {
        let id = $(this).data("objectid");
        let response;
        try {
            response = await fetch(`detail?gameid=${id}`,{
                method:'get',
                headers: {
                    'Accept':'application/json, text/plain, */*, text/html',
                    'Content-type':'text/html'
                }
            });
        } catch (err) {
            console.error(err.stack);
        }
        if (response.ok) {
            try {
                let game = await response.json();
                $("#secret").text(game.secret_number);
                $("#num_guesses").text(game.guesses.length);
                $("#date").text(game.time_stamp);
                game.guesses.forEach(guess => {
                    $("<li/>").addClass("list-item").text(guess).append("<a/>").appendTo("ul");
                })
                $('table').hide();
                $('#game_detail').show();
                $('#history').show();
            } catch (error) {
                console.error(error.stack);
            }
        }
        console.log("here");
    })
    $('#history').on("click", showHistory).hide();
    

    function showHistory() {
        // clear detail section
        $("#secret").text("");
        $("#num_guesses").text("");
        $('ul').empty();
        $("#game_detail").hide();
        $('#history').hide();
        $("table").show();
    }
});
