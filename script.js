/* Portfolio interactions and resilient GitHub REST API integration. */
(() => {
  'use strict';
  const USERNAME = 'appu223';
  const API_URL = `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`;
  const state = { projects: [], filter: 'all', query: '', live: false };
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* A complete fallback set means the project area remains useful offline. */
  const fallbackProjects = [
    { name: 'CodeAlpha Tasks', html_url: 'https://github.com/appu223/codealpha_Tasks', description: 'A collection of practical development tasks and experiments.', language: 'JavaScript', topics: ['web', 'tasks'], stargazers_count: 0, forks_count: 0, updated_at: '2026-01-01', created_at: '2025-01-01', open_issues_count: 0, default_branch: 'main', visibility: 'public' },
    { name: 'ChaiShop-Co CRM', html_url: 'https://github.com/appu223/ChaiShop-Co-CRM', description: 'Customer relationship management project for a modern shop workflow.', language: 'JavaScript', topics: ['crm', 'web'], stargazers_count: 0, forks_count: 0, updated_at: '2026-01-01', created_at: '2025-01-01', open_issues_count: 0, default_branch: 'main', visibility: 'public' },
    { name: 'Smart Estate', html_url: 'https://github.com/appu223/SmartEstate-Django--python-', description: 'A smart real-estate application built with Django and Python.', language: 'Python', topics: ['django', 'python', 'real-estate'], stargazers_count: 0, forks_count: 0, updated_at: '2026-01-01', created_at: '2025-01-01', open_issues_count: 0, default_branch: 'main', visibility: 'public' },
    { name: 'OpenCV Instagram Reels Scroller', html_url: 'https://github.com/appu223/Open-CV-auto-instagram-reels-scroller-python-', description: 'Python and OpenCV automation experiment for reels scrolling.', language: 'Python', topics: ['python', 'opencv', 'automation'], stargazers_count: 0, forks_count: 0, updated_at: '2026-01-01', created_at: '2025-01-01', open_issues_count: 0, default_branch: 'main', visibility: 'public' },
    { name: 'Portfolio Website', html_url: 'https://github.com/appu223/protfolio-', description: 'Personal portfolio website and creative-development experiments.', language: 'HTML', topics: ['html', 'css', 'portfolio'], stargazers_count: 0, forks_count: 0, updated_at: '2026-01-01', created_at: '2025-01-01', open_issues_count: 0, default_branch: 'main', visibility: 'public' }
  ];

  function escapeHtml(value = '') {
    return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  }

  function formatDate(date) {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? 'Unknown' : new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(parsed);
  }

  function projectText(project) {
    return [project.name, project.description, project.language, ...(project.topics || [])].filter(Boolean).join(' ').toLowerCase();
  }

  function isMatch(project) {
    const text = projectText(project);
    const language = (project.language || '').toLowerCase();
    const topics = (project.topics || []).join(' ').toLowerCase();
    const filterRules = {
      all: true,
      python: language.includes('python') || topics.includes('python'),
      javascript: language.includes('javascript') || language.includes('typescript') || topics.includes('javascript'),
      'html/css': language.includes('html') || language.includes('css') || topics.includes('html') || topics.includes('css'),
      django: topics.includes('django') || (project.description || '').toLowerCase().includes('django'),
      flutter: language.includes('dart') || topics.includes('flutter') || topics.includes('dart'),
      other: !['python', 'javascript', 'typescript', 'html', 'css', 'dart'].some(item => language.includes(item))
    };
    return filterRules[state.filter] && text.includes(state.query);
  }

  function projectCard(project) {
    const topics = (project.topics || []).slice(0, 4).map(topic => `<span class="topic-badge">${escapeHtml(topic)}</span>`).join('');
    const description = project.description || 'Public GitHub repository - explore the source code and project details.';
    const url = escapeHtml(project.html_url);
    return `<div class="col"><article class="project-card">
      <p class="mono-label">${escapeHtml(project.visibility || 'public')} Â· ${escapeHtml(project.default_branch || 'main')}</p>
      <h3>${escapeHtml(project.name)}</h3>
      <p class="project-description">${escapeHtml(description)}</p>
      <div class="project-meta"><span class="language-badge">${escapeHtml(project.language || 'Unspecified')}</span>${topics}</div>
      <div class="repo-details"><span><i class="bi bi-star-fill"></i>${project.stargazers_count || 0} stars</span><span><i class="bi bi-diagram-2"></i>${project.forks_count || 0} forks</span><span><i class="bi bi-clock-history"></i>${formatDate(project.updated_at)}</span><span><i class="bi bi-exclamation-circle"></i>${project.open_issues_count || 0} issues</span></div>
      <div class="project-actions"><a href="${url}" target="_blank" rel="noopener noreferrer"><i class="bi bi-code-square"></i> View Source</a><a href="${url}" target="_blank" rel="noopener noreferrer"><i class="bi bi-box-arrow-up-right"></i> Open Repository</a></div>
    </article></div>`;
  }

  function renderProjects() {
    const grid = $('#project-grid');
    const projects = state.projects.filter(isMatch);
    grid.innerHTML = projects.length ? projects.map(projectCard).join('') : '<div class="col-12"><p class="empty-projects">No repositories match this filter. Try another category or search phrase.</p></div>';
  }

  function renderSkeletons() {
    $('#project-grid').innerHTML = Array.from({ length: 6 }, () => '<div class="col"><div class="skeleton" aria-hidden="true"></div></div>').join('');
  }

  function animateNumber(element, finalValue) {
    if (!Number.isFinite(finalValue)) { element.textContent = '-'; return; }
    if (reducedMotion) { element.textContent = finalValue; return; }
    const start = performance.now(); const duration = 700;
    const draw = now => { const progress = Math.min((now - start) / duration, 1); element.textContent = Math.round(finalValue * (1 - Math.pow(1 - progress, 3))).toLocaleString(); if (progress < 1) requestAnimationFrame(draw); };
    requestAnimationFrame(draw);
  }

  function updateStats(projects, live) {
    const stars = projects.reduce((total, item) => total + (item.stargazers_count || 0), 0);
    const forks = projects.reduce((total, item) => total + (item.forks_count || 0), 0);
    const languages = projects.reduce((counts, item) => { if (item.language) counts[item.language] = (counts[item.language] || 0) + 1; return counts; }, {});
    const topLanguage = Object.entries(languages).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Not available';
    const latest = projects.slice().sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))[0];
    animateNumber($('#stat-repos'), projects.length); animateNumber($('#stat-stars'), stars); animateNumber($('#stat-forks'), forks);
    $('#stat-language').textContent = topLanguage; $('#stat-update').textContent = latest ? formatDate(latest.updated_at) : '-';
    $('#stats-title').textContent = live ? 'Live repository statistics' : 'Repository statistics';
  }

  async function enrichReadmes(repositories) {
    /* README endpoint is fetched selectively, avoiding needless rate-limit pressure. */
    return Promise.all(repositories.map(async repository => {
      try {
        const response = await fetch(`https://api.github.com/repos/${USERNAME}/${encodeURIComponent(repository.name)}/readme`, { headers: { Accept: 'application/vnd.github+json' } });
        if (!response.ok || repository.description) return repository;
        const data = await response.json();
        if (data.content) {
          const text = decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
          return { ...repository, description: text.replace(/^#.*$/m, '').replace(/\s+/g, ' ').trim().slice(0, 150) || repository.description };
        }
      } catch (_) { /* A README is optional; retain repository data. */ }
      return repository;
    }));
  }

  async function loadGitHubProjects() {
    const status = $('#github-status'); renderSkeletons();
    const timeout = new AbortController(); const timeoutId = setTimeout(() => timeout.abort(), 10000);
    try {
      const response = await fetch(API_URL, { headers: { Accept: 'application/vnd.github+json' }, signal: timeout.signal });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const message = response.status === 403 ? 'GitHub rate limit reached' : `GitHub returned ${response.status}`;
        throw new Error(message);
      }
      const repos = await response.json();
      if (!Array.isArray(repos) || !repos.length) throw new Error('No public repositories found');
      state.projects = await enrichReadmes(repos); state.live = true;
      status.textContent = `Showing ${repos.length} live public repositories from GitHub.`; status.classList.remove('error');
    } catch (error) {
      clearTimeout(timeoutId); state.projects = fallbackProjects; state.live = false;
      status.textContent = `Live GitHub data is unavailable (${error.name === 'AbortError' ? 'request timed out' : error.message}). Showing known projects instead.`; status.classList.add('error');
    }
    renderProjects(); updateStats(state.projects, state.live);
  }

  function buildWeb() {
    const lines = $('#web-lines'); if (!lines) return;
    const center = [250, 250];
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12; const outer = [250 + Math.cos(angle) * 224, 250 + Math.sin(angle) * 224];
      lines.insertAdjacentHTML('beforeend', `<path class="web-line" d="M${center[0]} ${center[1]} L${outer[0].toFixed(1)} ${outer[1].toFixed(1)}" style="animation-delay:${index * .06}s"/>`);
    }
    [70, 125, 180, 220].forEach((radius, row) => { let path = ''; for (let index = 0; index <= 12; index += 1) { const angle = (Math.PI * 2 * index) / 12; const x = 250 + Math.cos(angle) * radius; const y = 250 + Math.sin(angle) * radius; path += `${index ? ' L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; } lines.insertAdjacentHTML('beforeend', `<path class="web-line" d="${path}" style="animation-delay:${.3 + row * .12}s"/>`); });
  }

  function crackWeb(event) {
    const stage = $('#web-stage'); const cracks = $('#crack-lines'); const rect = stage.getBoundingClientRect();
    const pointerX = event.clientX ?? rect.left + rect.width / 2; const pointerY = event.clientY ?? rect.top + rect.height / 2;
    const x = ((pointerX - rect.left) / rect.width) * 500; const y = ((pointerY - rect.top) / rect.height) * 500;
    cracks.innerHTML = ''; for (let index = 0; index < 9; index += 1) { const angle = (Math.PI * 2 * index) / 9 + Math.random() * .25; const length = 55 + Math.random() * 105; const midX = x + Math.cos(angle) * (length * .45) + (Math.random() - .5) * 20; const midY = y + Math.sin(angle) * (length * .45) + (Math.random() - .5) * 20; const endX = x + Math.cos(angle) * length; const endY = y + Math.sin(angle) * length; cracks.insertAdjacentHTML('beforeend', `<path class="crack-line" d="M${x.toFixed(1)} ${y.toFixed(1)} L${midX.toFixed(1)} ${midY.toFixed(1)} L${endX.toFixed(1)} ${endY.toFixed(1)}" style="animation-delay:${index * .035}s"/>`); }
    stage.classList.add('is-active'); setTimeout(() => { cracks.innerHTML = ''; }, 1100);
  }

  function initializeChat() {
    const toggle = $('#chat-toggle'); const panel = $('#chat-panel'); const close = $('#chat-close');
    const form = $('#chat-form'); const input = $('#chat-input'); const messages = $('#chat-messages');
    const endpoint = window.PORTFOLIO_CHAT_ENDPOINT || '';
    const open = () => { panel.hidden = false; toggle.setAttribute('aria-expanded', 'true'); input.focus(); };
    const hide = () => { panel.hidden = true; toggle.setAttribute('aria-expanded', 'false'); toggle.focus(); };
    const addMessage = (text, role) => { const item = document.createElement('div'); item.className = `chat-message ${role}`; item.textContent = text; messages.append(item); messages.scrollTop = messages.scrollHeight; return item; };
    const localReply = question => {
      const query = question.toLowerCase();
      if (/^(hi|hello|hey|good morning|good evening)/.test(query)) return 'Hello! I am Alphonse\'s portfolio assistant. Ask about projects, skills, education, services, or how to get in touch.';
      if (/phone|call|email|contact|reach/.test(query)) return 'You can call Alphonse at +91 90920 38096 or email alphonseniccori123@gmail.com. You can also use the GitHub and LinkedIn links in the Contact section.';
      if (/hire|available|freelance|job|opportunity|collaborat/.test(query)) return 'Alphonse is open to opportunities in graphic design, digital marketing, UI/UX design, front-end development, and creative technology. Please get in touch by phone or email to discuss your requirement.';
      if (/skill|technology|tech|programming|design tool|figma/.test(query)) return 'Alphonse works with HTML5, CSS3, JavaScript, Python, Java, PHP, SQL, UI/UX design, graphic design, Figma, Git, GitHub, MySQL, Firebase, Flutter, Android Studio, and XAMPP.';
      if (/project|work|github|portfolio|smart cyber|grocery|school|car shop/.test(query)) return 'Featured work includes Smart Cyber Hub, Smart Grocery, Car Shop E-Commerce Website, and School Management System. The Projects section also loads live public GitHub repositories from appu223.';
      if (/experience|internship|sisesoft|ti metal/.test(query)) return 'Alphonse completed UI/UX Design work at Sisesoft IT Solutions in Hosur, covering web development, e-commerce, UI/UX, SEO, chatbot integration, and modern web tools. He also worked on data analysis and visualization at TI Metal Forming.';
      if (/education|study|college|degree|mca|bca/.test(query)) return 'Alphonse is pursuing an MCA at Sacred Heart College, Yelagiri Hills (2026-2028), after completing a BCA at Don Bosco College, Yelagiri Hills (2023-2026).';
      if (/service|can you do|what do you offer|help me/.test(query)) return 'Alphonse can help with graphic design, responsive websites, front-end interfaces, UI/UX design, visual design systems, and creative technology projects.';
      if (/location|where|tamil nadu|india/.test(query)) return 'Alphonse is based in Elathagiri, Tamil Nadu, India.';
      if (/thank/.test(query)) return 'You are welcome! Feel free to ask another question or contact Alphonse directly for a project discussion.';
      return 'I can help with Alphonse\'s portfolio, services, skills, projects, education, experience, location, and contact details. For a specific request, please contact Alphonse at +91 90920 38096 or alphonseniccori123@gmail.com.';
    };
    toggle.addEventListener('click', () => panel.hidden ? open() : hide()); close.addEventListener('click', hide);
    form.addEventListener('submit', async event => {
      event.preventDefault(); const question = input.value.trim(); if (!question) return; addMessage(question, 'user'); input.value = '';
      const typing = addMessage('Thinking...', 'typing');
      try {
        if (!endpoint) { await new Promise(resolve => setTimeout(resolve, 350)); typing.remove(); addMessage(localReply(question), 'bot'); return; }
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: question }) });
        if (!response.ok) throw new Error('Chat service unavailable'); const data = await response.json(); typing.remove(); addMessage(data.reply || 'I could not find a response right now.', 'bot');
      } catch (_) { typing.remove(); addMessage(localReply(question), 'bot'); }
    });
  }

  function initializeInteractions() {
    buildWeb();
    initializeChat();
    const stage = $('#web-stage'); stage.addEventListener('pointerdown', crackWeb); stage.addEventListener('mouseenter', crackWeb, { once: true });
    stage.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); crackWeb(event); } });
    $$('.filter-button').forEach(button => button.addEventListener('click', () => { state.filter = button.dataset.filter; $$('.filter-button').forEach(item => item.classList.toggle('active', item === button)); renderProjects(); }));
    $('#project-search').addEventListener('input', event => { state.query = event.target.value.trim().toLowerCase(); renderProjects(); });
    const nav = $('#main-nav'); const topButton = $('#back-to-top');
    window.addEventListener('scroll', () => { const scrolled = window.scrollY > 20; nav.classList.toggle('scrolled', scrolled); topButton.classList.toggle('visible', window.scrollY > 650); }, { passive: true });
    topButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' }));
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); const progress = $('.progress-bar', entry.target); if (progress) progress.style.width = progress.dataset.width; observer.unobserve(entry.target); } }), { threshold: .12 });
    $$('.reveal,.knowledge-card').forEach(element => observer.observe(element));
    $$('.navbar .nav-link').forEach(link => link.addEventListener('click', () => { const collapse = $('#nav-menu'); if (collapse.classList.contains('show')) bootstrap.Collapse.getOrCreateInstance(collapse).hide(); }));
  }

  document.addEventListener('DOMContentLoaded', () => { initializeInteractions(); loadGitHubProjects(); });
  window.loadGitHubProjects = loadGitHubProjects;
})();
