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
        let sortedWords = words.slice().sort();
        let sortedHidden = this.hidden.slice().sort();
        if (sortedWords.join(',') !== sortedHidden.join(',')) {
            throw new Error(`Words ${words} do not match hidden ${this.hidden}`);
        }
    }

    toString() {
        return `Hidden: "${this.hidden}"`;
    }
}

export function simpleGuess(hidden: Hidden): string[] {
    let toRemove = new Set();
    let U = hidden.universe;
    for (let i = 0; i < U.length; i++) {
        let testSet = U.slice();
        let [rem] = testSet.splice(i, 1);
        if (hidden.guess(testSet)) {
            toRemove.add(rem);
        }
    }
    return U.filter(w => !toRemove.has(w));
}

// assumes guess(target + forced) = true 
// returns minimal result subset of target such that guess(result + forced) = true
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
    let rightResult = bisectSimple(hidden, right, leftResult.concat(forced));
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

function generateHidden(U: string[]) {
    let hidden = [];
    for (let i = 0; i < U.length; i++) {
        let coinFlip = Math.random() > 0.5;
        if (coinFlip) {
            hidden.push(U[i]);
        }
    }
    // randomize order
    hidden = hidden.sort(() => Math.random() - 0.5);
    return new Hidden(U, hidden);
}

function calc(times: number[]) {
    let sum = times.reduce((a, b) => a + b, 0);
    let avg = sum / times.length;
    let variance = times.map(t => Math.pow(t - avg, 2)).reduce((a, b) => a + b, 0) / times.length;
    let stdDev = Math.sqrt(variance);
    let worseCase = Math.max(...times);
    let bestCase = Math.min(...times);
    console.log(`Average guesses: ${avg.toPrecision(4)}, Standard Deviation: ${stdDev.toPrecision(4)}, Worst Case: ${worseCase}, Best Case: ${bestCase}`);
}

let FUNCTIONS = ['add', 'cos', 'div', 'exp', 'mod', 'mul', 'sin', 'sqr'];
let TESTS = 10_000;
let U = ['a'];
for (let i = 1; i < 9; i++) {
    let simpleTimes: number[] = [];
    let bisectTimes: number[] = [];
    let bisectEasyHardTimes: number[] = [];
    for (let i = 0; i < TESTS; i++) {
        let hidden = generateHidden(U);
        let hidden2 = hidden.clone();
        let hidden3 = hidden.clone();

        let words = simpleGuess(hidden);
        // console.log(`Simple Guessed ${hidden} with ${hidden.guesses} guesses`);
        hidden.verify(words);
        simpleTimes.push(hidden.guesses);

        let words2 = bisectSimple(hidden2, hidden2.universe, []);
        // console.log(`Bisect Guessed ${hidden2} with ${hidden2.guesses} guesses`);
        hidden2.verify(words2);
        bisectTimes.push(hidden2.guesses);

        let words3 = bisectEasyHard(hidden3, hidden3.universe, []);
        // console.log(`Bisect Easy Hard Guessed ${hidden3} with ${hidden3.guesses} guesses`);
        hidden3.verify(words3);
        bisectEasyHardTimes.push(hidden3.guesses);
    }

    console.log('Universe Size: ', U.length);
    let emptyHidden = new Hidden(U, []);
    let fullHidden = new Hidden(U, U);
    bisectSimple(emptyHidden, emptyHidden.universe, []);
    bisectSimple(fullHidden, fullHidden.universe, []);
    console.log('Empty Hidden Guesses: ', emptyHidden.guesses);
    console.log('Full Hidden Guesses: ', fullHidden.guesses);    

    console.log('Simple:');
    calc(simpleTimes);
    console.log('Bisect:');
    calc(bisectTimes);
    console.log('Bisect Easy Hard:');
    calc(bisectEasyHardTimes);

    // double for next iteration
    U = U.concat(U.map(f => f + i));
}
