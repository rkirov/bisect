export class Hidden {
    guesses = 0;
    constructor(public universe: string[], private hidden: string[]) {
        for (let h of hidden) {
            if (universe.indexOf(h) < 0) {
                throw new Error(`Hidden word ${h} is not in universe`);
            }
        }
    }

    clone() {
        return new Hidden(this.universe, this.hidden);
    }

    guess(words: string[]) {
        // console.log(`Guessing ${words} against ${this.hidden}`);
        this.guesses++;
        let guessSet = new Set(words);
        for (let h of this.hidden) {
            if (!guessSet.has(h)) {
                return false;
            }
        }
        return true;
    }

    verify(words: string[]) {
        if (words.sort().join('') !== this.hidden.sort().join('')) {
            throw new Error(`Words ${words} do not match hidden ${this.hidden}`);
        }
    }
    toString() {
        return `Hidden: "${this.hidden}"`;
    }
}

export function simpleGuess(hidden: Hidden): string[] {
    let cur = hidden.universe.slice();
    for (let i = 0; i < hidden.universe.length; i++) {
        let w = hidden.universe[i];
        let words = cur.filter(c => c !== w);
        if (hidden.guess(words)) {
            cur = words;
        }
    }
    return cur;
}

// assumes guess(target + forced) = true 
// returns minimal result such that guess(target + forced) = true
function bisectSimple(hidden: Hidden, targets: string[], forced: string[]): string[] {
    if (targets.length === 0 || hidden.guess(forced)) {
        return [];
    }
    // if forced was not enough and targets is singleton, it is minimal
    if (targets.length === 1) {
        return targets;
    }
    let m = Math.floor(targets.length / 2);
    let left = targets.slice(0, m);
    let right = targets.slice(m);
    let leftResult = bisectSimple(hidden, left, right.concat(forced));
    let rightResult = bisectSimple(hidden, right, forced.concat(leftResult));
    return leftResult.concat(rightResult);
}

function bisectEasyHard(hidden: Hidden, targets: string[], forced: string[]): string[] {
    if (targets.length === 0 || hidden.guess(forced)) {
        return [];
    }
    return bisectEasyHardInner(hidden, targets, forced);
}

function bisectEasyHardInner(hidden: Hidden, targets: string[], forced: string[]): string[] {
    if (targets.length === 1) {
        return targets;
    }
    let m = Math.floor(targets.length / 2);
    let left = targets.slice(0, m);
    let right = targets.slice(m);
    if (hidden.guess(forced.concat(left))) {
        return bisectEasyHardInner(hidden, left, forced);
    }
    if (hidden.guess(forced.concat(right))) {
        return bisectEasyHardInner(hidden, right, forced);
    }
    let leftResult = bisectEasyHardInner(hidden, left, right.concat(forced));
    let rightResult = bisectEasyHardInner(hidden, right, forced.concat(leftResult));
    return leftResult.concat(rightResult);
}


let FUNCTIONS = ['add', 'cos', 'div', 'exp', 'mod', 'mul', 'sin', 'sqr', 'sub', 'tan'];
let TESTS = 10_000;

function generateHidden(U: string[]) {
    let hidden = [];
    for (let i = 0; i < U.length; i++) {
        let coinFlip = Math.random() > 0.5;
        if (coinFlip) {
            hidden.push(U[i]);
        }
    }
    return new Hidden(U, hidden);
}



function calc(times: number[]) {
    let sum = times.reduce((a, b) => a + b, 0);
    let avg = sum / times.length;
    let variance = times.map(t => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) / times.length;
    let stdDev = Math.sqrt(variance);
    console.log(`Average guesses: ${avg}, Standard Deviation: ${stdDev}`);
}

let U = FUNCTIONS;
for (let i = 1; i < 10; i++) {

    let simpleTimes: number[] = [];
    let bisectTimes: number[] = [];
    let bisectEasyHardTimes: number[] = [];
    for (let i = 0; i < TESTS; i++) {
        let hidden = generateHidden(U);
        let words = simpleGuess(hidden);
        hidden.verify(words);
        // console.log(`Simple Guessed ${hidden} with ${hidden.guesses} guesses`);
        simpleTimes.push(hidden.guesses);

        let hidden2 = hidden.clone();
        let words2 = bisectSimple(hidden2, hidden2.universe, []);
        hidden2.verify(words2);
        // console.log(`Bisect Guessed ${hidden2} with ${hidden2.guesses} guesses`);
        bisectTimes.push(hidden2.guesses);

        let hidden3 = hidden.clone();
        let words3 = bisectEasyHard(hidden3, hidden3.universe, []);
        hidden3.verify(words3);
        // console.log(`Bisect Easy Hard Guessed ${hidden3} with ${hidden3.guesses} guesses`);
        bisectEasyHardTimes.push(hidden3.guesses);
    }

    console.log('Universe Size: ', U.length);
    console.log('Simple:');
    calc(simpleTimes);
    console.log('Bisect:');
    calc(bisectTimes);
    console.log('Bisect Easy Hard:');
    calc(bisectEasyHardTimes);
    // add 10 more for next run
    U = U.concat(FUNCTIONS.map(f => f + i));
}
