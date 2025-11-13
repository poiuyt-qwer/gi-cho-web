const quotes = [
'When you have eliminated the impossible, whatever remains, however improbable, must be the truth.',
'There is nothing more deceptive than an obvious fact.',
'I ought to know by this time that when a fact appears to be opposed to a long train of deductions it invariably proves to be capable of bearing some other interpretation.',
'I never make exceptions. An exception disproves the rule.',
'What one man can invent another can discover.',
'Nothing clears up a case so much as stating it to another person.',
'Education never ends, Watson. It is a series of lessons, with the greatest for the last.',
];

// 테스트용
// const quotes = ['1 2', '2 3', '3 4'];

let words = [];
let wordIndex = 0;
let startTime = Date.now();
let bestScore = localStorage.getItem('bestScore') || null;
let previousLength = 0;   // ghost letter용: 이전 input 길이



const quoteElement = document.getElementById('quote');
const messageElement = document.getElementById('message');
const typedValueElement = document.getElementById('typed-value');
const startButtonElement = document.getElementById('start');

document.getElementById('start').addEventListener('click', () => {
    typedValueElement.disabled = false;
    startButtonElement.disabled = true;
    const quoteIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[quoteIndex];
    words = quote.split(' ');
    wordIndex = 0;
    const spanWords = words.map(function(word) { return `<span>${word} </span>`});
    quoteElement.innerHTML = spanWords.join('');
    quoteElement.childNodes[0].className = 'highlight';
    messageElement.innerText = '';
    typedValueElement.value = '';
    typedValueElement.focus();
    startTime = new Date().getTime();
    previousLength = 0;
});

typedValueElement.addEventListener('input', () => {
    const currentWord = words[wordIndex];
    const typedValue = typedValueElement.value;

    const currentLength = typedValue.length;

    // 1) 길이가 늘어났을 때만 ghost letter 생성
    if (currentLength > previousLength) {
        const newChar = typedValue[currentLength - 1];
        if (newChar && newChar.trim() !== '') {
            createGhostLetter(newChar);
        }
    }

    if (typedValue === currentWord && wordIndex === words.length - 1) {
        const elapsedTime = new Date().getTime() - startTime;
        const currentTime = (elapsedTime / 1000);

        let resultMsg = `You finished in ${currentTime} seconds.`;

        if (bestScore === null || currentTime < bestScore) {
            bestScore = currentTime;
            localStorage.setItem('bestScore', bestScore);
        }

        document.getElementById('modal-message').innerText = resultMsg;
        document.getElementById('best-score').innerText = `Best score: ${bestScore} seconds`;
        document.getElementById('result-modal').style.display = 'block';

        messageElement.innerText = '';
        typedValueElement.value = '';
        typedValueElement.disabled = true;
        startButtonElement.disabled = false;
    } else if (typedValue.endsWith(' ') && typedValue.trim() === currentWord) { //
        typedValueElement.value = '';
        wordIndex++;
        for (const wordElement of quoteElement.childNodes) {
            wordElement.className = '';
        }
        quoteElement.childNodes[wordIndex].className = 'highlight';
    } else if (currentWord.startsWith(typedValue)) {
        typedValueElement.classList.remove('error');
        typedValueElement.classList.remove('wave-shake');
    } else {
        typedValueElement.classList.add('error');

        // wave shake 효과 초기화 후 재적용 (애니메이션 반복 가능)
        typedValueElement.classList.remove('wave-shake'); 
        void typedValueElement.offsetWidth; // 리플로우로 애니메이션 재시작 트릭
        typedValueElement.classList.add('wave-shake');
    }
    previousLength = typedValueElement.value.length;
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('result-modal').style.display = 'none';
});

window.onclick = function(event) {
    const modal = document.getElementById('result-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}


function createGhostLetter(char) {
    // 입력 칸 위치 가져오기
    const rect = typedValueElement.getBoundingClientRect();

    // span 요소 생성
    const span = document.createElement('span');
    span.textContent = char;
    span.className = 'ghost-letter';

    // input 중앙 근처에서 랜덤하게 조금 옆으로 튀어나오게 위치 설정
    const randomOffsetX = (Math.random() * 40) - 20;  // -20 ~ +20px
    span.style.left = (rect.left + rect.width / 2 + randomOffsetX) + 'px';
    span.style.top = (rect.top + window.scrollY - 5) + 'px';

    // body에 추가
    document.body.appendChild(span);

    // 애니메이션이 끝나면 DOM에서 제거
    span.addEventListener('animationend', () => {
        span.remove();
    });
}
