export default class AccordionWidget {
    constructor(content, rootId) {
        if (!content) {
            throw new Error('content must be defined');
        }
        this.content = content;
        this.locationStack = [];
        this.rootId = rootId;
    }

    init() {
        this.appendChild();
        // adding event to click back the headers
        document.querySelector(`#${this.rootId}`).addEventListener('click', (e) => this.clickBackEvent(e));
    }

    get currentChild() {
        let curr = this.content;
        for (let i = 0; i < this.locationStack.length; i++) {
            curr = curr.children[this.locationStack[i]];
        }
        return curr;
    }

    async chooseOne(idx) {
        // changing verbiage of this question
        const question = document.querySelector(`#${this.rootId}`).lastElementChild.querySelector('.question');
        question.textContent += ` ${this.currentChild.children[idx].answer}`;
        this.locationStack.push(idx);
        this.minimizeLastChild();
        await this.appendChild();
    }

    async chooseOneEvent(e) {
        const template = document.querySelector('#template').content;
        const repeatedItems = template.querySelector('.repeated-items');
        if (e.target.nodeName === repeatedItems.nodeName) {
            // adding the selected choice and rendering the next questions
            const idx = this.currentChild.children.map((i) => i.answer)
                .indexOf(e.target.textContent);
            if (idx >= this.currentChild.children.length || idx === -1) {
                throw new Error('choice is larger than the number of children');
            }
            await this.chooseOne(idx);
        }
    }

    async appendChild() {
        const root = document.querySelector(`#${this.rootId}`);
        if (this.currentChild.children && this.currentChild.children.length > 0) {
            const template = document.querySelector('#template').content;
            const constNewChild = template.cloneNode(true);
            const question = constNewChild.querySelector('.question');
            if (!question) {
                throw new Error('No `.question` found in the template');
            }
            question.textContent = this.currentChild.text;
            const firstRepeat = constNewChild.querySelector('.repeated-items');
            if (!firstRepeat) {
                throw new Error('No `.repeated-items` found in the template');
            }
            // adding in the event listener for the children
            firstRepeat.parentNode.addEventListener('click', (e) => this.chooseOneEvent(e));

            // adding in the text content for the various children
            firstRepeat.textContent = this.currentChild.children[0].answer;
            for (let i = 1; i < this.currentChild.children.length; i++) {
                const cloneNode = firstRepeat.cloneNode();
                cloneNode.textContent = this.currentChild.children[i].answer;
                firstRepeat.parentNode.append(cloneNode);
            }
            root.append(constNewChild);
        } else { // terminus point with no children
            const template = document.querySelector('#answer-template').content;
            const newChild = template.cloneNode(true);

            // handling the self-referential text
            if (this.currentChild.referential) {
                const referentialObj = this.currentChild.referential;
                if (!referentialObj.text) {
                    throw new Error('the referential object must have a text attribute');
                }
                if (!referentialObj.referentialAnswer) {
                    throw new Error('the referential object must have a referentialAnswer attribute');
                }
                const linkStartIdx = referentialObj.text.indexOf(referentialObj.referentialAnswer);
                if (linkStartIdx === -1) {
                    throw new Error('the referentialAnswer must be a substring of the referential object text attribute');
                }

                // adding text link to go back to the previous answer
                const link = document.createElement('a');
                link.textContent = referentialObj.referentialAnswer;
                link.onclick = (e) => (this.findPreviousMention(e));
                newChild.querySelector('.answer').textContent = referentialObj.text.substring(0, linkStartIdx);
                newChild.querySelector('.answer').appendChild(link);
                // adding text that may have been cutoff by the above substring operation
                const endSubstringLength = referentialObj.referentialAnswer.length + linkStartIdx;
                if (endSubstringLength < referentialObj.text.length) {
                    const answerDuplicate = newChild.cloneNode(false);
                    answerDuplicate.textContent = referentialObj.text.substring(endSubstringLength);
                    newChild.querySelector('.answer').appendChild(answerDuplicate);
                }
            } else { // handling normal terminus text
                newChild.querySelector('.answer').textContent = this.currentChild.text;
            }
            root.append(newChild);
        }
    }

    async findPreviousMention(e) {
        // BFS to find the child of the root containing the answer
        let found = [];
        const queue = [[]];
        let ref = this.content; // used later for the matching location
        while (found.length === 0 && queue.length > 0) {
            const item = queue.shift();
            ref = this.content;
            // eslint-disable-next-line no-restricted-syntax
            for (const idx of item) {
                ref = ref.children[idx];
            }
            // eslint-disable-next-line no-plusplus
            for (let i = 0; i < ref.children.length; i++) {
                if (ref.children[i].answer === e.target.textContent) {
                    found = item.concat(i);
                    break;
                }
                if (ref.children[i].children) {
                    queue.push(item.concat(i));
                }
            }
        }
        if (found.length === 0) {
            throw new Error(`referentialAnswer, "${e.target.textContent}", not found in the entire content tree. 
                \nPlease check that it is verbatim referenced with no space differences`);
        }
        let numOfCommonElementsFromStart = 0;
        for (let i = 0; i < this.locationStack.length && i < found.length; i++) {
            if (found[i] === this.locationStack[i]) {
                numOfCommonElementsFromStart += 1;
            } else {
                break;
            }
        }
        const questionOfCommonAncestor = document.querySelector(`#${this.rootId}`).children[numOfCommonElementsFromStart].querySelector('.question');
        this.clickBack(questionOfCommonAncestor);
        this.locationStack.splice(
            numOfCommonElementsFromStart,
            this.locationStack.length - numOfCommonElementsFromStart,
        );
        found.splice(0, numOfCommonElementsFromStart);
        // append the following children
        // timeout added to force transition/animation to occur
        setTimeout(async () => this.appendMultipleChildren(found), 120);
    }

    async appendMultipleChildren(choices) {
        // eslint-disable-next-line no-restricted-syntax
        for (const choice of choices) {
            // While not ideal, the order of the await loops do matter.
            // TODO: refactor this so the async operation takes advantage of parallelization
            // eslint-disable-next-line no-await-in-loop
            await this.chooseOne(choice);
        }
    }

    minimizeLastChild() {
        const root = document.querySelector(`#${this.rootId}`);
        const lastChild = root.lastElementChild;
        lastChild.classList.remove('is-active');
        AccordionWidget.nearRoot(lastChild).classList.add('hiding');
    }

    static nearRoot(ele) {
        let curr = ele.querySelector('.question');
        while (curr.parentNode !== ele) {
            curr = curr.parentNode;
        }
        let curr2 = ele.querySelector('.repeated-items');
        while (curr2.parentNode !== ele) {
            curr2 = curr2.parentNode;
        }
        if (curr === curr2) {
            throw new Error('The question and repeated items should have different parent nodes!');
        }
        return curr2;
    }

    clickBackEvent(e) {
        this.clickBack(e.target);
    }

    clickBack(ele) {
        const root = document.querySelector(`#${this.rootId}`);
        const lastChild = root.lastElementChild;
        const closeRoot = ele.closest('.root');
        if (ele.classList.contains('question') && closeRoot !== lastChild) {
            // Below is removing all elements except the one clicked
            let numToDelete = 0;
            while (root.lastElementChild !== closeRoot) {
                root.removeChild(root.lastElementChild);
                numToDelete += 1;
            }
            this.locationStack = this.locationStack
                .slice(0, this.locationStack.length - numToDelete);
            closeRoot.querySelector('.question').textContent = this.currentChild.text;
            // switch the styling back to being visible
            AccordionWidget.nearRoot(closeRoot).classList.remove('hiding');
        }
    }
}
