// ==UserScript==
// @name         Twitter Always Show Not Interested
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Always shows the Not Interested button on Twitter posts
// @author       You
// @match        *://*.twitter.com/*
// @match        *://*.x.com/*
// @include      *://*.twitter.com/*
// @include      *://*.x.com/*
// @grant        GM_log
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const DEBUG = false;
    function log(...args) {
        if (DEBUG) {
            console.log('%c[Not Interested Button]', 'background: #222; color: #bada55', ...args);
        }
    }

    log('Script loaded and starting...');

    function createNotInterestedButton() {
        log('Creating new Not Interested button');
        const button = document.createElement('button');
        button.className = 'css-175oi2r r-1777fci r-bt1l66 r-bztko3 r-lrvibr r-1loqt21 r-1ny4l3l not-interested-btn';
        button.setAttribute('aria-label', 'Not interested in this post');
        button.setAttribute('role', 'button');
        button.style.marginRight = '8px';
        // Adjust the button layout to be more inline
        button.innerHTML = `
            <div dir="ltr" class="css-146c3p1 r-bcqeeo r-1ttztb7 r-qvutc0 r-1qd0xha r-a023e6 r-rjixqe r-16dba41 r-1awozwy r-6koalj r-1h0z5md r-o7ynqc r-clp7b1 r-3s2u2q" style="color: rgb(113, 118, 123); display: flex; align-items: center;">
                <div class="css-175oi2r r-xoduu5" style="display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" class="r-4qtqp9 r-yyyyoo r-1xvli5t r-dnmrzs r-bnwqim r-1plcrui r-lrvibr r-1hdv0qi" style="height: 1.25em;">
                        <g><path d="M9.5 7c.828 0 1.5 1.119 1.5 2.5S10.328 12 9.5 12 8 10.881 8 9.5 8.672 7 9.5 7zm5 0c.828 0 1.5 1.119 1.5 2.5s-.672 2.5-1.5 2.5S13 10.881 13 9.5 13.672 7 14.5 7zM12 22.25C6.348 22.25 1.75 17.652 1.75 12S6.348 1.75 12 1.75 22.25 6.348 22.25 12 17.652 22.25 12 22.25zm0-18.5c-4.549 0-8.25 3.701-8.25 8.25s3.701 8.25 8.25 8.25 8.25-3.701 8.25-8.25S16.549 3.75 12 3.75zM8.947 17.322l-1.896-.638C7.101 16.534 8.322 13 12 13s4.898 3.533 4.949 3.684l-1.897.633c-.031-.09-.828-2.316-3.051-2.316s-3.021 2.227-3.053 2.322z"></path></g>
                    </svg>
                </div>
            </div>
        `;

        return button;
    }

    function isInForYouFeed() {
        // Check if we're in the For You feed by looking for the tab indicator
        const tabs = document.querySelectorAll('[role="tab"]');
        for (const tab of tabs) {
            if (tab.textContent.includes('For you') && tab.getAttribute('aria-selected') === 'true') {
                return true;
            }
        }
        return false;
    }

    function addNotInterestedClickHandler(button, article) {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const moreButton = article.querySelector('[data-testid="caret"]');
            if (!moreButton) {
                log('Could not find More button');
                return;
            }
            moreButton.click();

            setTimeout(() => {
                const menu = document.querySelector('[role="menu"]');
                if (!menu) {
                    log('Menu not found');
                    return;
                }

                const notInterestedItem = Array.from(menu.querySelectorAll('[role="menuitem"]'))
                    .find(item => item.textContent.includes('Not interested in this post'));

                if (notInterestedItem) {
                    log('Found Not Interested option, clicking it');
                    notInterestedItem.click();
                } else {
                    log('Not Interested option not found in menu');
                    moreButton.click();
                }
            }, 100);
        });
    }

    function insertNotInterestedButton(article) {
        // Only proceed if we're in the For You feed
        if (!isInForYouFeed()) {
            return;
        }

        log('Attempting to insert button into article:', article);

        if (!article.tagName || article.tagName !== 'ARTICLE') {
            log('Warning: Not an article element:', article);
            return;
        }

        if (article.querySelector('.not-interested-btn')) {
            log('Button already exists for this article, skipping');
            return;
        }

        const moreButton = article.querySelector('[data-testid="caret"]');
        if (!moreButton) {
            log('Could not find More button');
            return;
        }

        const actionsContainer = moreButton.closest('.css-175oi2r.r-18u37iz.r-1h0z5md');
        if (!actionsContainer) {
            log('Could not find actions container');
            return;
        }

        log('Found appropriate container for button insertion');

        const button = createNotInterestedButton();
        const container = document.createElement('div');
        container.className = 'css-175oi2r r-18u37iz r-1h0z5md';
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.appendChild(button);

        actionsContainer.parentNode.insertBefore(container, actionsContainer);
        log('Successfully inserted button');

        addNotInterestedClickHandler(button, article);
    }

    // ... rest of the observer code stays the same ...

    function initializeObserver() {
        log('Initializing MutationObserver');

        const config = {
            childList: true,
            subtree: true
        };

        const observer = new MutationObserver((mutations) => {
            // Only process if we're in the For You feed
            if (!isInForYouFeed()) return;

            log(`Processing ${mutations.length} mutations`);

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.tagName === 'ARTICLE') {
                        log('Found new article directly');
                        insertNotInterestedButton(node);
                    } else if (node.querySelector) {
                        const articles = node.querySelectorAll('article');
                        if (articles.length > 0) {
                            log(`Found ${articles.length} articles in added node`);
                            articles.forEach(insertNotInterestedButton);
                        }
                    }
                }
            }
        });

        try {
            observer.observe(document.body, config);
            log('Successfully started observing document body');
        } catch (error) {
            console.error('Error starting observer:', error);
        }

        return observer;
    }

    // Start the observer only if we're in the For You feed
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeObserver);
    } else {
        initializeObserver();
    }

    // Periodically check for new articles, but only in For You feed
    setInterval(() => {
        if (!isInForYouFeed()) return;

        const articles = document.querySelectorAll('article:not(:has(.not-interested-btn))');
        if (articles.length > 0) {
            log(`Found ${articles.length} articles without buttons`);
            articles.forEach(insertNotInterestedButton);
        }
    }, 5000);

    log('Script initialization completed');
})();
