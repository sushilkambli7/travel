import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

// Your web app's Firebase configuration
import { firebaseConfig } from "./firebase-config.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const blogsRef = ref(database, '/Blogs/');

let allBlogs = [];

// Function to render blogs
function renderBlogs(blogsData) {
    const grid = document.getElementById('blogs-grid');
    const loadingState = document.getElementById('loading-state');
    const noBlogsFound = document.getElementById('no-blogs-found');

    if (!grid) return;

    if (loadingState) loadingState.style.display = 'none';
    grid.innerHTML = '';

    const blogsArray = Object.entries(blogsData).map(([id, data]) => ({
        id,
        ...data
    }));

    if (blogsArray.length === 0) {
        if (noBlogsFound) noBlogsFound.classList.remove('hidden');
        return;
    }

    if (noBlogsFound) noBlogsFound.classList.add('hidden');

    blogsArray.forEach(blog => {
        const blogCard = document.createElement('div');
        blogCard.className = 'bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group';
        blogCard.onclick = () => window.location.href = `blog.html?id=${blog.id}`;

        blogCard.innerHTML = `
            <div class="relative h-64 overflow-hidden">
                <img src="${blog.Thumb || 'https://via.placeholder.com/800x600?text=No+Image'}" 
                     alt="${blog.Title}" 
                     class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
                <div class="absolute top-4 left-4">
                    <span class="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-xs font-bold rounded-full shadow-sm uppercase tracking-wider">
                        ${blog.Category || 'Travel'}
                    </span>
                </div>
            </div>
            <div class="p-6">
                <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    ${blog.Title}
                </h3>
                <p class="text-gray-600 mb-6 line-clamp-2 text-sm leading-relaxed">
                    ${stripHtml(blog.Content).substring(0, 120)}...
                </p>
                <div class="flex items-center justify-between pt-4 border-t border-gray-50">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">
                            ${(blog.Author || 'A')[0]}
                        </div>
                        <div class="text-left">
                            <p class="text-xs font-bold text-gray-900">${blog.Author || 'Pirates Droid'}</p>
                            <p class="text-[10px] text-gray-500">${blog.Date || ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-gray-400">
                        <i data-lucide="clock" class="h-3 w-3"></i>
                        <span class="text-[10px] font-medium">${blog.ReadTime || '5 min read'}</span>
                    </div>
                </div>
            </div>
        `;
        grid.appendChild(blogCard);
    });

    // Re-initialize icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

function stripHtml(html) {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

// Fetch data from Firebase
onValue(blogsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        allBlogs = data;
        renderBlogs(data);
    } else {
        renderBlogs({});
    }
});

// Search and Filter Logic
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const categoryBtns = document.querySelectorAll('.category-btn');

    const filterBlogs = () => {
        const searchTerm = searchInput.value.toLowerCase();
        const activeBtn = document.querySelector('.category-btn.active');
        const selectedCategory = activeBtn.textContent.trim().toLowerCase();

        const filtered = Object.fromEntries(
            Object.entries(allBlogs).filter(([id, blog]) => {
                const titleMatch = blog.Title.toLowerCase().includes(searchTerm);
                const contentMatch = blog.Content.toLowerCase().includes(searchTerm);
                const categoryMatch = selectedCategory === 'all' ||
                    blog.Category.toLowerCase() === selectedCategory;

                return (titleMatch || contentMatch) && categoryMatch;
            })
        );

        renderBlogs(filtered);
    };

    if (searchInput) {
        searchInput.addEventListener('input', filterBlogs);
    }

    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => {
                b.classList.remove('active', 'bg-blue-600', 'text-white', 'border-blue-600');
                b.classList.add('bg-white', 'text-gray-700', 'border-gray-200');
            });
            btn.classList.add('active', 'bg-blue-600', 'text-white', 'border-blue-600');
            btn.classList.remove('bg-white', 'text-gray-700', 'border-gray-200');
            filterBlogs();
        });
    });

    // Mobile menu toggle (copied from index.js pattern)
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', function () {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // Lucide init
    if (window.lucide) {
        window.lucide.createIcons();
    }
});
