// Dynamic Content Loader for Coq Carlanais
class ContentLoader {
    constructor() {
        this.basePath = window.location.hostname === 'localhost' ? '' : '';
        this.markdownParser = new markdownit();
    }

    // Load and parse markdown files
    async loadMarkdownFile(path) {
        try {
            const response = await fetch(`${this.basePath}${path}`);
            if (!response.ok) throw new Error(`Failed to load ${path}`);
            const content = await response.text();
            return this.parseFrontmatter(content);
        } catch (error) {
            console.error('Error loading markdown:', error);
            return null;
        }
    }

    // Parse frontmatter from markdown files
    parseFrontmatter(content) {
        const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (match) {
            const frontmatter = match[1];
            const body = match[2];
            
            // Simple YAML parser for frontmatter
            const data = {};
            frontmatter.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > -1) {
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();
                    
                    // Remove quotes if present
                    if ((value.startsWith('"') && value.endsWith('"')) || 
                        (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.substring(1, value.length - 1);
                    }
                    
                    data[key] = value;
                }
            });
            
            return { data, body: this.markdownParser.render(body) };
        }
        
        return { data: {}, body: this.markdownParser.render(content) };
    }

    // Load club information
    async loadClubInfo() {
        const about = await this.loadMarkdownFile('content/club/about.md');
        const contact = await this.loadMarkdownFile('content/club/contact.md');
        
        if (about) {
            const aboutSection = document.querySelector('#club .about-content');
            if (aboutSection) {
                aboutSection.innerHTML = `
                    <div class="about-text">
                        <h2>${about.data.title || 'Le Club'}</h2>
                        ${about.body}
                    </div>
                `;
            }
        }
        
        if (contact) {
            // Update contact information throughout the site
            this.updateContactInfo(contact.data);
        }
    }

    // Update contact information
    updateContactInfo(contact) {
        // Update footer
        const footerInfo = document.querySelector('.footer-info');
        if (footerInfo && contact.address && contact.phone && contact.email) {
            footerInfo.innerHTML = `
                <p>${contact.address}</p>
                <p>${contact.phone} | ${contact.email}</p>
            `;
        }
    }

    // Load teams
    async loadTeams() {
        const teamFiles = [
            'u7-u9.md', 'u11.md', 'u13-filles.md', 'u13-garcons.md',
            'u15-filles.md', 'u15-garcons.md', 'u18-garcons.md',
            'senior-garcons.md', 'senior-filles.md', 'loisir.md',
            'sante.md', 'comite-animation.md'
        ];
        
        const teamsContainer = document.querySelector('.team-cards');
        if (!teamsContainer) return;
        
        teamsContainer.innerHTML = ''; // Clear loading content
        
        for (const file of teamFiles) {
            const team = await this.loadMarkdownFile(`content/teams/${file}`);
            if (team) {
                const scheduleHtml = team.data.schedule ? 
                    team.data.schedule.split('\n').map(line => 
                        `<div>${line}</div>`
                    ).join('') : '';
                
                const teamCard = document.createElement('div');
                teamCard.className = 'team-card';
                teamCard.innerHTML = `
                    <img src="photos/${team.data.image}" alt="Équipe de basket ${team.data.title} du Coq Carlanais" class="team-img" loading="lazy">
                    <div class="team-info">
                        <h3>${team.data.title}</h3>
                        <p>${team.data.description}</p>
                        <div class="team-schedule">
                            ${scheduleHtml}
                        </div>
                    </div>
                `;
                teamsContainer.appendChild(teamCard);
            }
        }
    }

    // Load sponsors
    async loadSponsors() {
        const sponsorFiles = [
            'batileze.md', 'couderc.md', 'pons.md', 
            'occitanie-proprietes.md', 'danicy.md'
        ];
        
        const sponsors = {
            gold: [],
            silver: [],
            bronze: []
        };
        
        for (const file of sponsorFiles) {
            const sponsor = await this.loadMarkdownFile(`content/sponsors/${file}`);
            if (sponsor && sponsor.data.tier) {
                sponsors[sponsor.data.tier].push(sponsor.data);
            }
        }
        
        this.renderSponsors(sponsors);
    }

    // Render sponsors by tier
    renderSponsors(sponsors) {
        const tiers = ['gold', 'silver', 'bronze'];
        
        tiers.forEach(tier => {
            const container = document.querySelector(`[data-tier="${tier}"]`);
            if (container) {
                container.innerHTML = '';
                
                sponsors[tier].forEach(sponsor => {
                    const sponsorElement = document.createElement('div');
                    sponsorElement.className = `sponsor-logo active`;
                    sponsorElement.setAttribute('data-category', tier);
                    sponsorElement.innerHTML = `
                        <a href="${sponsor.url}" target="_blank" rel="noopener">
                            <img src="photos/sponsor/${sponsor.logo}" alt="${sponsor.name}" class="sponsor-logo-img">
                        </a>
                        <p class="sponsor-name">${sponsor.name}</p>
                        <p class="tier-label">Partenaire ${tier}</p>
                    `;
                    container.appendChild(sponsorElement);
                });
            }
        });
    }

    // Load pricing information
    async loadPricing() {
        const pricing = await this.loadMarkdownFile('content/pricing/membership.md');
        if (!pricing) return;
        
        this.renderPricingTable(pricing);
        this.renderPricingNotes(pricing);
    }

    // Render pricing table
    renderPricingTable(pricing) {
        const tableBody = document.querySelector('.pricing-table tbody');
        if (!tableBody || !pricing.data.tiers) return;
        
        tableBody.innerHTML = pricing.data.tiers.map(tier => `
            <tr>
                <td>${tier.category}</td>
                <td>${tier.price}</td>
            </tr>
        `).join('');
    }

    // Render pricing notes
    renderPricingNotes(pricing) {
        const notesContainer = document.querySelector('.pricing-notes');
        if (!notesContainer) return;
        
        let notesHtml = '';
        if (pricing.data.notes_title) {
            notesHtml += `<h3>${pricing.data.notes_title}</h3>`;
        }
        
        if (pricing.data.notes) {
            notesHtml += `
                <ul class="notes-list">
                    ${pricing.data.notes.map(note => `
                        <li>
                            <i class="fas fa-info-circle"></i>
                            <div>${note}</div>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        notesContainer.innerHTML = notesHtml;
    }

    // Load schedule image
    async loadSchedule() {
        const schedule = await this.loadMarkdownFile('content/schedule/image.md');
        if (schedule && schedule.data.image) {
            const scheduleImg = document.querySelector('.schedule-image');
            if (scheduleImg) {
                scheduleImg.src = `photos/${schedule.data.image}`;
            }
        }
    }

    // Initialize all content
    async init() {
        try {
            await Promise.all([
                this.loadClubInfo(),
                this.loadTeams(),
                this.loadSponsors(),
                this.loadPricing(),
                this.loadSchedule()
            ]);
            
            console.log('All dynamic content loaded successfully');
        } catch (error) {
            console.error('Error loading dynamic content:', error);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Load markdown-it library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/markdown-it@14.0.0/dist/markdown-it.min.js';
    script.onload = function() {
        const loader = new ContentLoader();
        loader.init();
    };
    document.head.appendChild(script);
});
