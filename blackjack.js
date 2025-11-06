// let cardOne = 7;
// let cardTwo = 5;
// let sum = cardOne + cardTwo;
// let cardOneBank = 7;
// let cardTwoBank = 5;
// let cardThreeBank = 6;
// let cardFourBank = 4;

// let cardThree = 7;
// sum += cardThree;
// if(sum > 21){
//     console.log('You lost');
// }
// console.log(`You have ${sum} points`);

// let bankSum = cardOneBank + cardTwoBank + cardThreeBank + cardFourBank;

// if(bankSum > 21 || (sum <=21 && sum > bankSum)){
//     console.log('You win');
// } else{
//     console.log('Bank wins');
// }

let player = 0;
let dealer = 0;
Math.floor(Math.random() * 10) + 1;
player += Math.floor(Math.random() * 10) + 1;
dealer += Math.floor(Math.random() * 10) + 1;
while(true){
    player += Math.floor(Math.random() * 10) + 1;
    dealer += Math.floor(Math.random() * 10) + 1;
    if(player > 21 && dealer > 21){
        console.log('draw'); break;
    }
    else if(dealer > 21){
        console.log('you win'); break;
    }
    else if(player > 21){
        console.log('you lost'); break;
    }
    else continue;
}