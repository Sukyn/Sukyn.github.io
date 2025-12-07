/*!
* Start Bootstrap - Resume v7.0.6 (https://startbootstrap.com/theme/resume)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-resume/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Activate Bootstrap scrollspy on the main nav element
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});

window.addEventListener('DOMContentLoaded', event => {

    // Existing scrollspy + nav collapse logic
    const sideNav = document.body.querySelector('#sideNav');
    if (sideNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#sideNav',
            rootMargin: '0px 0px -40%',
        });
    }

    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

    // NEW: load blog posts for the "Blog" section
    loadBlogPosts();
});

// ---- Blog front-end ---------------------------------------

async function loadBlogPosts() {
    const container = document.getElementById('blog-posts-container');
    if (!container) return;

    try {
        const res = await fetch('/api/posts');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const posts = await res.json();

        if (!posts.length) {
            container.innerHTML = '<p class="text-muted">No posts yet.</p>';
            return;
        }

        container.innerHTML = '';
        posts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'blog-post-card';

            const dateStr = post.date
                ? new Date(post.date).toLocaleDateString()
                : '';

            const tags =
                post.tags && post.tags.length
                    ? `<span> · ${post.tags.map(escapeHtml).join(', ')}</span>`
                    : '';

            const pdfLink = post.pdfUrl
                ? `<div><a class="blog-post-readmore" href="${escapeAttr(
                      post.pdfUrl
                  )}" target="_blank" rel="noopener noreferrer">
                       Open associated PDF
                   </a></div>`
                : '';

            article.innerHTML = `
                <h3 class="blog-post-title">${escapeHtml(post.title || '')}</h3>
                <div class="blog-post-meta">
                  <span>${dateStr}</span>
                  ${tags}
                </div>
                <div class="blog-post-summary">
                  ${post.summary || ''}
                </div>
                ${pdfLink}
            `;

            container.appendChild(article);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML =
            '<p class="text-danger">Could not load blog posts.</p>';
    }
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
    // Slightly stricter escape for attributes
    return escapeHtml(str).replace(/`/g, '&#096;');
}
