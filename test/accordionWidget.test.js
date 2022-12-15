import { AccordionWidget } from "../src/accordionWidget.js";

describe('AccordionWidget tests', () => {
    test('widget is able to be loaded', () => {
        const data = {'hi': 'content'}
        const dummyObj = new AccordionWidget(data, 'blah-blah')
        expect(dummyObj.currentChild).toBe(data)
    });
});