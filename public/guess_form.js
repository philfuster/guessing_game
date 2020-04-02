$(document).ready ( function () {
    // setup event handler
    $('#play_again').click(init_game);
    $('#guess_input').on("click", handle_guess);
    $('form').on('keypress', function(e){
        if(e.which === 13) {
            e.preventDefault();
            $('#guess_input').click();
        } else {
            return true;
        }
    });

})

function init_game() {
    var jax = $.get('start');
    jax.done(()=>{
        showStart();
        $('li').remove();
    })
}
async function handle_guess() {
    // the button clicked has an input as its sibling - so selecting that will allows to pull
    // the input value from the correct text box.
    var guess = $(this).siblings('input').val();
    if (!guess) return;
    $(this).siblings('input').val("");
    console.log("guess = " + guess);
    let response = await fetch('guess',{
        method: 'post',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({guess: guess})
    });
    let json =
     await response.json();
    console.log(`Response json from guess: ${json}`);

    if( json.result == 'success') {
        showSuccess();
        return;
    }
    // creating stuff is easier... especially with the chaining syntax of jquery operations
    if ( json.result == 'low') {
        $('<li/>').addClass('lowGuess').text(guess + ' is too low').appendTo('ul');
    }
    else {
        $('<li/>').addClass('highGuess').text(guess + ' is too high.').appendTo('ul');
    }
    showCheck();    
}

function showStart() {
    $('#success_page').hide();
    $('#start_page').show();
    $('.instructions').show();
}

function showCheck() {
    $('.instructions').hide();
    $('#start_page').show();
}
function showSuccess() {
    $('#start_page').hide();
    $('#success_page').show();
}