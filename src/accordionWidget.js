export class AccordionWidget {
    constructor(content, rootId) {
        if (!content) {
            throw 'content must be defined'
        }
        this.content = content;
        this.locationStack = [];
        this.rootId = rootId;
    }

    init() {
        this.appendChild();
        // adding event to click back the headers
        document.querySelector(`#${this.rootId}`).addEventListener('click', e => this.clickBack(e));
    }

    get currentChild() {
        let curr = this.content;
        for (let i = 0; i < this.locationStack.length; i++) {
            curr = curr.children[this.locationStack[i]];
        }
        return curr;
    }

    chooseOneEvent(e) {
        const template = document.querySelector('#template').content;
        const repeatedItems = template.querySelector('.repeated-items');
        if (e.target.nodeName === repeatedItems.nodeName) {
            // changing verbiage of this question
            const question = e.target.closest('.root').querySelector('.question');
            question.textContent += ` ${e.target.textContent}`;

            // adding the selected choice and rendering the next questions
            const idx = this.currentChild.children.map(i => i.answer).indexOf(e.target.textContent);
            if (idx >= this.currentChild.children.length || idx === -1) {
                throw `choice is larger than the number of children`
            }
            this.locationStack.push(idx);
            this.minimizeLastChild()
            this.appendChild();
        }
    }

    appendChild() {
        const root = document.querySelector(`#${this.rootId}`);
        if (this.currentChild.children && this.currentChild.children.length > 0) {
            const template = document.querySelector('#template').content;
            const constNewChild = template.cloneNode(true);
            const question = constNewChild.querySelector('.question')
            if (!question) {
                throw 'No `.question` found in the template'
            }
            question.textContent = this.currentChild.text;
            const firstRepeat = constNewChild.querySelector('.repeated-items');
            if (!firstRepeat) {
                throw 'No `.repeated-items` found in the template'
            }
            // adding in the event listener for the children
            firstRepeat.parentNode.addEventListener('click', e => this.chooseOneEvent(e))
            
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
            newChild.querySelector('.answer').textContent = this.currentChild.text;
            root.append(newChild);
        }
    }

    minimizeLastChild() {
        const root = document.querySelector(`#${this.rootId}`);
        const lastChild = root.lastElementChild;
        lastChild.classList.remove('is-active');
        this.nearRoot(lastChild).classList.add('hiding');
    }

    nearRoot(ele) {
        let curr = ele.querySelector('.question');
        while(curr.parentNode != ele) {
            curr = curr.parentNode;
        }
        let curr2 = ele.querySelector('.repeated-items')
        while(curr2.parentNode != ele) {
            curr2 = curr2.parentNode;
        }
        if (curr === curr2) {
            throw 'The question and repeated items should have different parent nodes!'
        }
        return curr2
    }

    clickBack(e) {
        const root = document.querySelector(`#${this.rootId}`)
        const lastChild = root.lastElementChild, 
            closeRoot = e.target.closest('.root');
        if (e.target.classList.contains('question') && closeRoot != lastChild) {
            // Below is removing all elements except the one clicked
            let numToDelete = 0;
            while(root.lastElementChild != closeRoot) {
                root.removeChild(root.lastElementChild);
                numToDelete += 1;
            }
            this.locationStack = this.locationStack.slice(0, this.locationStack.length - numToDelete);
            closeRoot.querySelector('.question').textContent = this.currentChild.text;
            // switch the styling back to being visible
            this.nearRoot(closeRoot).classList.remove('hiding');           
        }
        
    }
}