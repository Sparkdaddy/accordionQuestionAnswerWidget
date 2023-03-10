// eslint-disable-next-line import/extensions
import AccordionWidget from './accordionWidget.js';

document.addEventListener('DOMContentLoaded', async () => {
    const contentProm = await fetch('./example.json');
    const content = await contentProm.json();
    const accordionWidget = new AccordionWidget(content, 'root-id');
    accordionWidget.init();
});
