document.addEventListener('DOMContentLoaded', function () {

    const sidebar = document.getElementById('sidebar');
    const content = document.getElementById('content');

    function loadModule(module) {
        fetch(module)
            .then(response => {
                if (response.ok) {
                    return response.text();
                } else {
                    return fetch('Assets/Pages/404.html').then(response => response.text());
                }
            })
            .then(html => {
                content.innerHTML = html
                Prism.highlightAll()
                highlightPath(module)
            });
    }

    function updateNavigation() {
        const tags = new Map();
        modules.forEach(module => {
            fetch(module)
                .then(response => response.text())
                .then(html => {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');
                    const metaTags = doc.querySelector('meta[name="tags"]').getAttribute('content').split(',');
                    let currentMap = tags;
                    metaTags.forEach((tag, index) => {
                        tag = tag.trim();
                        if (!currentMap.has(tag)) {
                            currentMap.set(tag, new Map());
                        }
                        if (index === metaTags.length - 1) {
                            currentMap.get(tag).set('module', module);
                        } else {
                            currentMap = currentMap.get(tag);
                        }
                    });
                    generateSidebar(tags);
                });
        });
    }

    function generateSidebar(tags, parentElement = sidebar) {
        parentElement.innerHTML = '';
        const sortedTags = Array.from(tags.keys()).sort();
        sortedTags.forEach(tag => {
            if (tag !== 'module') {
                const tagElement = document.createElement('div');
                tagElement.className = 'tag';

                const tagText = document.createElement('span');
                tagText.className = 'tag-text';
                tagText.textContent = tag;

                // Add hover feedback
                tagText.addEventListener('mouseover', () => {
                    tagText.classList.add('hover');
                });
                tagText.addEventListener('mouseout', () => {
                    tagText.classList.remove('hover');
                });

                const childTags = tags.get(tag);
                if (childTags.has('module')) {
                    tagText.addEventListener('click', () => {
                        loadModule(childTags.get('module'));
                        highlightPath(childTags.get('module'));
                    });
                } else {
                    tagText.style.fontWeight = 'normal'; // Ensure it's not bold
                }

                tagElement.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleChildTags(tagElement);
                });

                tagElement.appendChild(tagText);
                parentElement.appendChild(tagElement);

                if (childTags.size > 1 || (childTags.size === 1 && !childTags.has('module'))) {
                    const childContainer = document.createElement('div');
                    childContainer.className = 'child-tags';
                    childContainer.style.display = 'none'; // Initially hide child tags
                    generateSidebar(childTags, childContainer);
                    tagElement.appendChild(childContainer);
                }
            }
        });
    }

    function toggleChildTags(tagElement) {
        const childTags = tagElement.querySelector('.child-tags');
        if (childTags) {
            if (childTags.style.display === 'none') {
                childTags.style.display = 'block';
            } else {
                childTags.style.display = 'none';
            }
        }
    }

    function highlightPath(module) {
        // Remove highlight from all tags
        const allTags = document.querySelectorAll('.tag-text');
        allTags.forEach(tag => {
            tag.classList.remove('highlight');
        });

        // Highlight only the tags that belong to the current module
        fetch(module)
            .then(response => response.text())
            .then(html => {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const metaTags = doc.querySelector('meta[name="tags"]').getAttribute('content').split(',');
                metaTags.forEach(tag => {
                    const tagElement = Array.from(document.querySelectorAll('.tag-text')).find(el => el.textContent.trim() === tag.trim());
                    if (tagElement) {
                        tagElement.classList.add('highlight');
                        let parentElement = tagElement.parentElement.closest('.tag');
                        while (parentElement) {
                            parentElement.querySelector('.tag-text').classList.add('highlight');
                            parentElement = parentElement.parentElement.closest('.tag');
                        }
                    }
                });
            });
    }

    updateNavigation();
});
